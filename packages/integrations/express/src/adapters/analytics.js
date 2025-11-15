import { EventEmitter } from 'node:events';

export class AnalyticsTracker extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      enabled: true,
      ...options
    };
  }

  trackConversion(req, savingsData) {
    if (!this.options.enabled) return;

    const payload = {
      path: req.path,
      method: req.method,
      savings: {
        percentage: savingsData.savings.percentage,
        tokens: savingsData.savings.tokens,
        cost: savingsData.savings.cost,
        compressionRatio: savingsData.metrics.compressionRatio,
        original: savingsData.original,
        converted: savingsData.converted
      },
      timestamp: Date.now()
    };

    this.emit('conversion', payload);
  }

  trackError(error, context = {}) {
    if (!this.options.enabled) return;

    this.emit('error', {
      error,
      context,
      timestamp: Date.now()
    });
  }
}

