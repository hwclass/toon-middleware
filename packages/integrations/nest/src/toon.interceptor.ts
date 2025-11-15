import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request, Response } from 'express';
import {
  detectClient,
  convertToTOON,
  calculateSavings
} from '@toon-middleware/core';
import {
  generateRequestId,
  measureDuration,
  toBigIntTime,
  isJsonSerializable,
  isLLMConfidenceHigh,
  isConvertiblePayload
} from '@toon-middleware/utils';
import { CacheManager } from '@toon-middleware/cache';
import { AnalyticsTracker } from './adapters/analytics.tracker.js';

export interface ToonInterceptorConfig {
  autoConvert?: boolean;
  confidenceThreshold?: number;
  responseConfidenceThreshold?: number;
  pricing?: {
    per1K?: number;
  };
}

/**
 * NestJS Interceptor for TOON conversion
 * Implements the imperative shell pattern for NestJS
 */
@Injectable()
export class ToonInterceptor implements NestInterceptor {
  private config: Required<ToonInterceptorConfig>;

  constructor(
    private readonly options: ToonInterceptorConfig = {},
    private readonly cache: CacheManager | null = null,
    private readonly analytics: AnalyticsTracker | null = null,
    private readonly logger: any = null
  ) {
    this.config = {
      autoConvert: true,
      confidenceThreshold: 0.8,
      responseConfidenceThreshold: 0.8,
      pricing: { per1K: 0.002 },
      ...options
    };
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = toBigIntTime();
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const requestId = request.headers['x-request-id'] as string || generateRequestId();

    this.logger?.debug('NestJS request received', {
      requestId,
      method: request.method,
      url: request.url,
      userAgent: request.headers['user-agent']
    });

    const requestData = {
      headers: request.headers,
      userAgent: request.headers['user-agent'] || '',
      path: request.path,
      method: request.method
    };

    const clientInfo = detectClient(requestData, {
      confidenceThreshold: this.config.confidenceThreshold,
      clock: () => new Date().toISOString()
    });

    // Attach client info to request for downstream use
    (request as any).clientInfo = clientInfo;

    return next.handle().pipe(
      map((data: any) => {
        const duration = measureDuration(startTime);

        this.logger?.info('NestJS request completed', {
          requestId,
          duration: `${duration.toFixed(2)}ms`,
          status: response.statusCode,
          clientType: clientInfo.type
        });

        // Check if we should convert to TOON
        if (this.shouldConvertResponse(clientInfo, data)) {
          return this.handleTOONConversion(
            data,
            request,
            response,
            requestId,
            startTime
          );
        }

        // Pass through without conversion
        response.setHeader('X-TOON-Mode', 'passthrough');
        response.setHeader('X-Request-ID', requestId);
        return data;
      })
    );
  }

  private shouldConvertResponse(clientInfo: any, data: any): boolean {
    return (
      this.config.autoConvert &&
      isLLMConfidenceHigh(clientInfo, this.config.responseConfidenceThreshold) &&
      isConvertiblePayload(data)
    );
  }

  private handleTOONConversion(
    data: any,
    request: Request,
    response: Response,
    requestId: string,
    startTime: bigint
  ): any {
    try {
      const cacheKey = this.cache?.generateKey(request, data);
      let toonResult = cacheKey ? this.cache.get(cacheKey) : null;

      if (!toonResult) {
        toonResult = convertToTOON(data);

        if (!toonResult.success) {
          this.logger?.warn('TOON conversion failed, falling back to JSON', {
            requestId,
            error: toonResult.error
          });

          response.setHeader('X-TOON-Error', 'Conversion failed - fallback to JSON');
          response.setHeader('X-TOON-Mode', 'fallback');
          return data;
        }

        if (this.cache && cacheKey) {
          this.cache.set(cacheKey, toonResult);
        }
      }

      if (!isJsonSerializable(data)) {
        this.logger?.warn('Payload not JSON serializable, skipping savings calculation', {
          requestId
        });

        response.setHeader('Content-Type', 'text/plain; charset=utf-8');
        response.setHeader('X-TOON-Mode', 'toon');
        response.setHeader('X-Request-ID', requestId);
        return toonResult.data;
      }

      const savings = calculateSavings(JSON.stringify(data), toonResult.data, {
        per1K: this.config.pricing.per1K,
        timestamp: new Date().toISOString()
      });

      // Set response headers
      response.setHeader('Content-Type', 'text/plain; charset=utf-8');
      response.setHeader('X-TOON-Savings', `${savings.savings.percentage}%`);
      response.setHeader('X-TOON-Tokens', `${savings.original.tokens}->${savings.converted.tokens}`);
      response.setHeader('X-TOON-Cost-Saved', `$${savings.savings.cost.toFixed(4)}`);
      response.setHeader('X-Request-ID', requestId);
      response.setHeader('X-TOON-Mode', 'toon');

      const duration = measureDuration(startTime);
      this.logger?.info('TOON conversion successful', {
        requestId,
        duration: `${duration.toFixed(2)}ms`,
        savings: savings.savings.percentage,
        tokensSaved: savings.savings.tokens,
        clientType: (request as any).clientInfo.type
      });

      // Track analytics
      this.analytics?.trackConversion(request, savings);

      return toonResult.data;
    } catch (error: any) {
      this.logger?.error('TOON conversion handler error', {
        requestId,
        error: error.message,
        stack: error.stack
      });

      response.setHeader('X-TOON-Error', 'Handler error - fallback to JSON');
      response.setHeader('X-TOON-Mode', 'fallback');
      return data;
    }
  }
}
