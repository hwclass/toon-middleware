/**
 * @typedef {import('../../types/index.js').SavingsCalculation} SavingsCalculation
 */

/**
 * Pure function: Estimate token count for text
 * @param {string | object | Array<unknown>} text
 * @param {import('../../types/index.js').TokenEstimationOptions} [options]
 * @returns {number}
 */
export function estimateTokens(text, options = {}) {
  let normalisedText = text;
  if (typeof normalisedText !== 'string') {
    try {
      normalisedText = JSON.stringify(normalisedText);
    } catch {
      normalisedText = String(normalisedText);
    }
  }

  const {
    charsPerToken = 4,
    unicodeMultiplier = 1.2,
    jsonOverhead = 1.1
  } = options;

  const charCount = normalisedText.length;
  const hasUnicode = /[^\u0000-\u007F]/.test(normalisedText);
  const unicodeFactor = hasUnicode ? unicodeMultiplier : 1;
  const trimmed = normalisedText.trim();
  const jsonFactor = trimmed.startsWith('{') || trimmed.startsWith('[') ? jsonOverhead : 1;
  const tokens = Math.ceil((charCount / charsPerToken) * unicodeFactor * jsonFactor);

  return Math.max(1, tokens);
}

/**
 * Pure function: Calculate token savings between JSON and TOON
 * @param {string} jsonString
 * @param {string} toonString
 * @param {import('../../types/index.js').PricingConfig} [pricing]
 * @returns {SavingsCalculation}
 */
export function calculateSavings(
  jsonString,
  toonString,
  pricing = { per1K: 0.002 }
) {
  const jsonTokens = estimateTokens(jsonString);
  const toonTokens = estimateTokens(toonString);
  const tokenSavings = Math.max(0, jsonTokens - toonTokens);
  const percentage = jsonTokens > 0 ? Math.round((tokenSavings / jsonTokens) * 100) : 0;
  const costSavings = (tokenSavings / 1000) * pricing.per1K;

  const compressionRatio =
    jsonString.length > 0 ? toonString.length / jsonString.length : 1;
  const spaceEfficiency = Math.round((1 - compressionRatio) * 100);

  return {
    original: {
      tokens: jsonTokens,
      size: jsonString.length
    },
    converted: {
      tokens: toonTokens,
      size: toonString.length
    },
    savings: {
      tokens: tokenSavings,
      percentage,
      cost: costSavings,
      spaceEfficiency
    },
    metrics: {
      compressionRatio,
      tokensPerByte: {
        json: jsonTokens / Math.max(jsonString.length, 1),
        toon: toonTokens / Math.max(toonString.length, 1)
      }
    },
    pricing,
    calculatedAt: pricing.timestamp ?? '1970-01-01T00:00:00.000Z'
  };
}

