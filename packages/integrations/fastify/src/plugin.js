import fp from 'fastify-plugin';
import {
  detectClient,
  convertToTOON,
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
  isConvertiblePayload
} from '@toon-middleware/utils';
import { AnalyticsTracker } from './adapters/analytics.js';

/**
 * Fastify plugin for TOON middleware
 * Implements the imperative shell pattern for Fastify
 */
async function toonPlugin(fastify, options) {
  const config = {
    ...DEFAULT_CONFIG,
    ...options
  };

  const cache = config.cache ? new CacheManager(config.cacheOptions) : null;
  const analytics = config.analytics ? new AnalyticsTracker(config.analyticsOptions) : null;
  const logger = config.logger || baseLogger;

  // Decorate fastify instance with analytics for external access
  if (analytics) {
    fastify.decorate('toonAnalytics', analytics);
  }

  if (cache) {
    fastify.decorate('toonCache', cache);
  }

  // Add onRequest hook to detect client and attach info
  fastify.addHook('onRequest', async (request, reply) => {
    const requestData = {
      headers: request.headers,
      userAgent: request.headers['user-agent'] || '',
      path: request.url,
      method: request.method
    };

    const clientInfo = detectClient(requestData, {
      confidenceThreshold: config.confidenceThreshold,
      clock: () => new Date().toISOString()
    });

    request.clientInfo = clientInfo;

    logger.debug('Fastify request received', {
      requestId: request.id,
      method: request.method,
      url: request.url,
      userAgent: request.headers['user-agent'],
      clientType: clientInfo.type
    });
  });

  // Add onSend hook to intercept and convert responses
  fastify.addHook('onSend', async (request, reply, payload) => {
    const startTime = toBigIntTime();

    // Skip if not auto-convert or not LLM client
    if (!config.autoConvert || !isLLMConfidenceHigh(request.clientInfo, config.responseConfidenceThreshold ?? 0.8)) {
      reply.header('X-TOON-Mode', 'passthrough');
      reply.header('X-Request-ID', request.id);
      return payload;
    }

    try {
      // Parse JSON payload if it's a string
      let data;
      if (typeof payload === 'string') {
        try {
          data = JSON.parse(payload);
        } catch {
          // Not JSON, skip conversion
          reply.header('X-TOON-Mode', 'passthrough');
          return payload;
        }
      } else if (Buffer.isBuffer(payload)) {
        try {
          data = JSON.parse(payload.toString('utf8'));
        } catch {
          reply.header('X-TOON-Mode', 'passthrough');
          return payload;
        }
      } else {
        data = payload;
      }

      // Check if payload is convertible
      if (!isConvertiblePayload(data)) {
        reply.header('X-TOON-Mode', 'passthrough');
        reply.header('X-Request-ID', request.id);
        return payload;
      }

      // Check cache
      const cacheKey = cache?.generateKey(request, data);
      let toonResult = cacheKey ? cache.get(cacheKey) : null;

      if (!toonResult) {
        toonResult = convertToTOON(data);

        if (!toonResult.success) {
          logger.warn('TOON conversion failed, falling back to JSON', {
            requestId: request.id,
            error: toonResult.error
          });

          reply.header('X-TOON-Error', 'Conversion failed - fallback to JSON');
          reply.header('X-TOON-Mode', 'fallback');
          return payload;
        }

        if (cache && cacheKey) {
          cache.set(cacheKey, toonResult);
        }
      }

      if (!isJsonSerializable(data)) {
        logger.warn('Payload not JSON serializable, skipping savings calculation', {
          requestId: request.id
        });

        reply.header('Content-Type', 'text/plain; charset=utf-8');
        reply.header('X-TOON-Mode', 'toon');
        reply.header('X-Request-ID', request.id);
        return toonResult.data;
      }

      const savings = calculateSavings(JSON.stringify(data), toonResult.data, {
        per1K: config.pricing?.per1K ?? 0.002,
        timestamp: new Date().toISOString()
      });

      // Set response headers
      reply.header('Content-Type', 'text/plain; charset=utf-8');
      reply.header('X-TOON-Savings', `${savings.savings.percentage}%`);
      reply.header('X-TOON-Tokens', `${savings.original.tokens}->${savings.converted.tokens}`);
      reply.header('X-TOON-Cost-Saved', `$${savings.savings.cost.toFixed(4)}`);
      reply.header('X-Request-ID', request.id);
      reply.header('X-TOON-Mode', 'toon');

      const duration = measureDuration(startTime);
      logger.info('TOON conversion successful', {
        requestId: request.id,
        duration: `${duration.toFixed(2)}ms`,
        savings: savings.savings.percentage,
        tokensSaved: savings.savings.tokens,
        clientType: request.clientInfo.type
      });

      // Track analytics
      analytics?.trackConversion(request, savings);

      return toonResult.data;
    } catch (error) {
      logger.error('TOON conversion handler error', {
        requestId: request.id,
        error: error.message,
        stack: error.stack
      });

      reply.header('X-TOON-Error', 'Handler error - fallback to JSON');
      reply.header('X-TOON-Mode', 'fallback');
      return payload;
    }
  });

  // Log request completion
  fastify.addHook('onResponse', async (request, reply) => {
    logger.info('Fastify request completed', {
      requestId: request.id,
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      clientType: request.clientInfo?.type
    });
  });
}

// Export as fastify plugin with metadata
export default fp(toonPlugin, {
  fastify: '5.x',
  name: '@toon-middleware/fastify'
});
