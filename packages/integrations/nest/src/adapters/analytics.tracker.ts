import { EventEmitter } from 'node:events';

export interface AnalyticsOptions {
  enabled?: boolean;
}

export interface ConversionPayload {
  timestamp: string;
  requestId?: string;
  path: string;
  method: string;
  userAgent?: string;
  clientType?: string;
  savings: {
    percentage: number;
    tokens: number;
    cost: number;
    compressionRatio: number;
  };
  original: {
    tokens: number;
    size: number;
  };
  converted: {
    tokens: number;
    size: number;
  };
}

export interface ErrorPayload {
  timestamp: string;
  error: {
    message: string;
    name: string;
    stack?: string;
  };
  context: Record<string, any>;
}

/**
 * Analytics tracker for NestJS integration
 * Emits events for conversion tracking
 */
export class AnalyticsTracker extends EventEmitter {
  enabled: boolean;

  constructor(options: AnalyticsOptions = {}) {
    super();
    this.enabled = options.enabled !== false;
  }

  /**
   * Track a successful TOON conversion
   */
  trackConversion(request: any, savings: any): void {
    if (!this.enabled) {
      return;
    }

    const payload: ConversionPayload = {
      timestamp: new Date().toISOString(),
      requestId: request.headers['x-request-id'],
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
   */
  trackError(error: Error, context: Record<string, any> = {}): void {
    if (!this.enabled) {
      return;
    }

    const payload: ErrorPayload = {
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
