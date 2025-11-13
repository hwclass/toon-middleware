import {
  detectClient,
  convertToTOON,
  convertFromTOON,
  calculateSavings
} from '@toon-middleware/core';
import { CacheManager } from '@toon-middleware/cache';
import { logger as baseLogger } from '@toon-middleware/logger';
import {
  DEFAULT_CONFIG,
  generateRequestId,
  measureDuration,
  toBigIntTime,
  isJsonSerializable,
  isLLMConfidenceHigh,
  isConvertiblePayload,
  wantsToonResponse
} from '@toon-middleware/utils';
import { TOONMiddlewareError } from './errors.js';
import { AnalyticsTracker } from './adapters/analytics.js';

/**
 * Imperative Shell: Express middleware with side effects
 * Coordinates pure functions and handles I/O operations
 */
export function createExpressToonMiddleware(options = {}) {
  const config = {
    ...DEFAULT_CONFIG,
    ...options
  };

  const cache = config.cache ? new CacheManager(config.cacheOptions) : null;
  const analytics = config.analytics ? new AnalyticsTracker(config.analyticsOptions) : null;
  const logger = config.logger || baseLogger;

  const middleware = async function toonMiddleware(req, res, next) {
    const startTime = toBigIntTime();
    const requestId = req.headers['x-request-id'] || generateRequestId();

    try {
      logger.debug('Request received', {
        requestId,
        method: req.method,
        url: req.originalUrl ?? req.url,
        userAgent: req.headers['user-agent']
      });

      const requestData = {
        headers: req.headers,
        userAgent: req.headers['user-agent'] || '',
        path: req.path,
        method: req.method
      };

      const clientInfo = detectClient(requestData, {
        confidenceThreshold: config.confidenceThreshold,
        clock: () => new Date().toISOString()
      });

      req.clientInfo = clientInfo;

      const originalJson = res.json.bind(res);
      const originalSend = res.send.bind(res);

      res.json = function toonAwareJson(payload) {
        if (shouldConvertResponse(clientInfo, payload, config)) {
          return handleTOONConversion(payload, req, res, {
            requestId,
            clientInfo,
            cache,
            analytics,
            logger,
            originalJson,
            originalSend,
            startTime,
            pricingPer1K: config.pricing?.per1K ?? 0.002
          });
        }

        res.set('X-TOON-Mode', 'passthrough');
        return originalJson(payload);
      };

      res.send = function toonAwareSend(body) {
        if (shouldConvertResponse(clientInfo, body, config)) {
          return handleTOONConversion(body, req, res, {
            requestId,
            clientInfo,
            cache,
            analytics,
            logger,
            originalJson,
            originalSend,
            startTime,
            pricingPer1K: config.pricing?.per1K ?? 0.002
          });
        }

        res.set('X-TOON-Mode', 'passthrough');
        return originalSend(body);
      };

      if (shouldConvertRequest(req)) {
        await handleRequestConversion(req, {
          requestId,
          cache,
          logger
        });
      }

      res.on('finish', () => {
        const duration = measureDuration(startTime);
        logger.info('Request completed', {
          requestId,
          duration: `${duration.toFixed(2)}ms`,
          status: res.statusCode,
          clientType: clientInfo.type
        });
      });

      next();
    } catch (error) {
      logger.error('Middleware error', {
        requestId,
        error: error.message,
        stack: error.stack,
        url: req.url
      });

      next(new TOONMiddlewareError('Middleware execution failed', error));
    }
  };

  // Expose analytics and cache for testing and external access
  middleware.analytics = analytics;
  middleware.cache = cache;

  return middleware;
}

async function handleTOONConversion(data, req, res, context) {
  const {
    requestId,
    clientInfo,
    cache,
    analytics,
    logger,
    originalJson,
    originalSend,
    startTime,
    pricingPer1K
  } = context;

  try {
    const cacheKey = cache?.generateKey(req, data);
    let toonResult = cacheKey ? cache.get(cacheKey) : null;

    if (!toonResult) {
      toonResult = convertToTOON(data);

      if (!toonResult.success) {
        logger.warn('TOON conversion failed, falling back to JSON', {
          requestId,
          error: toonResult.error
        });

        res.set('X-TOON-Error', 'Conversion failed - fallback to JSON');
        return originalJson(data);
      }

      if (cache && cacheKey) {
        cache.set(cacheKey, toonResult);
      }
    }

    if (!isJsonSerializable(data)) {
      logger.warn('Payload not JSON serialisable, skipping savings calculation', { requestId });
      return originalSend(toonResult.data);
    }

    const savings = calculateSavings(JSON.stringify(data), toonResult.data, {
      per1K: pricingPer1K ?? 0.002,
      timestamp: new Date().toISOString()
    });

    res.set('Content-Type', 'text/plain; charset=utf-8');
    res.set('X-TOON-Savings', `${savings.savings.percentage}%`);
    res.set('X-TOON-Tokens', `${savings.original.tokens}->${savings.converted.tokens}`);
    res.set('X-TOON-Cost-Saved', `$${savings.savings.cost.toFixed(4)}`);
    res.set('X-Request-ID', requestId);
    res.set('X-TOON-Mode', 'toon');

    const duration = measureDuration(startTime);
    logger.info('TOON conversion successful', {
      requestId,
      duration: `${duration.toFixed(2)}ms`,
      savings: savings.savings.percentage,
      tokensSaved: savings.savings.tokens,
      clientType: clientInfo.type
    });

    analytics?.trackConversion(req, savings);

    const buffer = Buffer.from(toonResult.data, 'utf8');
    res.set('Content-Length', buffer.byteLength.toString());
    return originalSend(buffer);
  } catch (error) {
    logger.error('TOON conversion handler error', {
      requestId,
      error: error.message,
      stack: error.stack
    });

    res.set('X-TOON-Error', 'Handler error - fallback to JSON');
    res.set('X-TOON-Mode', 'fallback');
    return originalJson(data);
  }
}

async function handleRequestConversion(req, context) {
  const { requestId, cache, logger } = context;
  const rawBody = extractRawBody(req);

  if (!rawBody) {
    return;
  }

  try {
    const cacheKey = cache?.hashData?.(rawBody);
    let parsed = cacheKey ? cache.get(cacheKey) : null;

    if (!parsed) {
      parsed = convertFromTOON(rawBody);

      if (!parsed.success) {
        logger.warn('Request TOON conversion failed, leaving body untouched', {
          requestId,
          error: parsed.error
        });
        return;
      }

      if (cache && cacheKey) {
        cache.set(cacheKey, parsed);
      }
    }

    req.body = parsed.data;
    req.headers['content-type'] = 'application/json';
  } catch (error) {
    logger.warn('Incoming TOON payload parse failure', {
      requestId,
      error: error.message
    });
  }
}

function shouldConvertResponse(clientInfo, data, config) {
  return (
    config.autoConvert &&
    isLLMConfidenceHigh(clientInfo, config.responseConfidenceThreshold ?? 0.8) &&
    isConvertiblePayload(data)
  );
}

function shouldConvertRequest(req) {
  const contentType = String(req.headers['content-type'] || '');
  return contentType.includes('text/plain') && wantsToonResponse(req.headers);
}

function extractRawBody(req) {
  if (typeof req.body === 'string') {
    return req.body;
  }

  if (Buffer.isBuffer(req.body)) {
    return req.body.toString('utf8');
  }

  if (req.body === undefined && req.rawBody) {
    return req.rawBody.toString();
  }

  return null;
}

