import { EventEmitter } from 'node:events';

/**
 * Analytics tracker for Fastify integration
 * Emits events for conversion tracking
 */
export class AnalyticsTracker extends EventEmitter {
  constructor(options = {}) {
    super();
    this.enabled = options.enabled !== false;
  }

  /**
   * Track a successful TOON conversion
   * @param {object} request - The Fastify request object
   * @param {object} savings - Savings data from calculateSavings
   */
  trackConversion(request, savings) {
    if (!this.enabled) {
      return;
    }

    const payload = {
      timestamp: new Date().toISOString(),
      requestId: request.headers['x-request-id'] || request.id,
      path: request.url,
      method: request.method,
      userAgent: request.headers['user-agent'],
      clientType: request.clientInfo?.type,
      savings: {
        percentage: savings.savings.percentage,
        tokens: savings.savings.tokens,
        cost: savings.savings.cost,
        compressionRatio: savings.savings.compressionRatio
      },
      original: {
        tokens: savings.original.tokens,
        size: savings.original.size
      },
      converted: {
        tokens: savings.converted.tokens,
        size: savings.converted.size
      }
    };

    this.emit('conversion', payload);
  }

  /**
   * Track an error during conversion
   * @param {Error} error - The error that occurred
   * @param {object} context - Additional context about the error
   */
  trackError(error, context = {}) {
    if (!this.enabled) {
      return;
    }

    const payload = {
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack
      },
      context
    };

    this.emit('error', payload);
  }
}
