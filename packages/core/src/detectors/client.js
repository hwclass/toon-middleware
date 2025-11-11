/**
 * @typedef {import('../../types/index.js').ClientDetectionResult} ClientDetectionResult
 */

const LLM_PATTERNS = [
  'openai',
  'claude',
  'gpt-',
  'gemini',
  'llama',
  'mistral',
  'anthropic',
  'ai-api',
  'llm-client',
  'toon-enabled'
];

/**
 * Pure function: Detect client type from request data
 * @param {import('../../types/index.js').ClientDetectionInput} requestData
 * @param {import('../../types/index.js').ClientDetectionOptions} [options]
 * @returns {ClientDetectionResult}
 */
export function detectClient(requestData, options = {}) {
  const {
    headers = {},
    userAgent = '',
    customDetectors = [],
    confidenceThreshold = 0.7,
    clock
  } = requestData || {};

  const mergedHeaders =
    typeof headers === 'object' && headers !== null ? headers : {};

  let scores = {
    LLM: 0,
    regular: 0
  };

  if (mergedHeaders['x-accept-toon'] === 'true') {
    scores.LLM += 100;
  }

  const acceptHeader = String(mergedHeaders.accept || '');
  if (acceptHeader.toLowerCase().includes('toon')) {
    scores.LLM += 50;
  }

  const ua = String(userAgent || mergedHeaders['user-agent'] || '').toLowerCase();
  const matchedPatterns = LLM_PATTERNS.filter(pattern => ua.includes(pattern));
  scores.LLM += matchedPatterns.length * 30;

  const detectors = Array.isArray(customDetectors)
    ? customDetectors
    : [];

  for (const detector of detectors) {
    if (typeof detector !== 'function') {
      continue;
    }

    try {
      const result = detector({
        headers: mergedHeaders,
        userAgent: ua,
        options
      });

      if (result && result.isLLM) {
        const confidence = clampNumber(result.confidence ?? 1, 0, 1);
        scores.LLM += confidence * 20;
      } else if (result && result.isRegular) {
        const confidence = clampNumber(result.confidence ?? 1, 0, 1);
        scores.regular += confidence * 10;
      }
    } catch {
      // ignore detector errors to keep purity
    }
  }

  const totalScore = scores.LLM + scores.regular;
  const llmConfidence = totalScore > 0 ? scores.LLM / totalScore : 0;
  const clientType = llmConfidence >= (options.confidenceThreshold ?? confidenceThreshold ?? 0.7)
    ? 'LLM'
    : 'regular';

  const timestamp =
    typeof options.clock === 'function'
      ? options.clock()
      : typeof clock === 'function'
        ? clock()
        : '1970-01-01T00:00:00.000Z';

  return {
    type: clientType,
    confidence: roundTo(llmConfidence, 2),
    scores: {
      LLM: roundTo(scores.LLM, 2),
      regular: roundTo(scores.regular, 2)
    },
    matchedPatterns,
    detectedAt: typeof timestamp === 'string' ? timestamp : '1970-01-01T00:00:00.000Z',
    source: 'pure-detection'
  };
}

/**
 * Pure function: Create a user-agent based detector
 * @param {string[]} patterns
 * @param {{ confidence?: number }} [options]
 * @returns {(requestData: { userAgent?: string; headers?: Record<string, string> }) => { isLLM: boolean; confidence: number; pattern?: string }}
 */
export function createUserAgentDetector(patterns, options = {}) {
  const normalisedPatterns = (patterns || []).map(pattern =>
    String(pattern || '').toLowerCase()
  );

  return function detectFromUserAgent(requestData) {
    const userAgent =
      String(requestData?.userAgent || requestData?.headers?.['user-agent'] || '').toLowerCase();

    const matched = normalisedPatterns.find(pattern => userAgent.includes(pattern));

    if (matched) {
      return {
        isLLM: true,
        confidence: clampNumber(options.confidence ?? 0.8, 0, 1),
        pattern: matched
      };
    }

    return { isLLM: false, confidence: 0 };
  };
}

/**
 * Pure function: Create a header based detector
 * @param {string} headerName
 * @param {(value: string) => boolean} predicate
 * @param {{ confidence?: number }} [options]
 * @returns {(requestData: { headers?: Record<string, string> }) => { isLLM?: boolean; isRegular?: boolean; confidence: number }}
 */
export function createHeaderDetector(headerName, predicate, options = {}) {
  const normalisedHeader = String(headerName || '').toLowerCase();
  const confidence = clampNumber(options.confidence ?? 0.6, 0, 1);

  return function detectFromHeader(requestData) {
    const headers = requestData?.headers || {};
    const headerValue = headers[normalisedHeader] ?? headers[headerName];

    if (typeof headerValue === 'string' && predicate(headerValue)) {
      return {
        isLLM: true,
        confidence
      };
    }

    return {
      isRegular: true,
      confidence: 1 - confidence
    };
  };
}

function clampNumber(value, min, max) {
  if (Number.isNaN(value)) {
    return min;
  }

  const numberValue = typeof value === 'number' ? value : Number(value);
  return Math.min(Math.max(numberValue, min), max);
}

function roundTo(value, precision) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

