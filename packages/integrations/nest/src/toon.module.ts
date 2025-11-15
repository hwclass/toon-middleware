import { Module, DynamicModule } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CacheManager } from '@toon-middleware/cache';
import { logger as baseLogger } from '@toon-middleware/logger';
import { DEFAULT_CONFIG } from '@toon-middleware/utils';
import { ToonInterceptor } from './toon.interceptor.js';
import { AnalyticsTracker } from './adapters/analytics.tracker.js';

/**
 * NestJS Module for TOON middleware
 * Provides dependency injection and configuration
 */
@Module({})
export class ToonModule {
  /**
   * Configure the TOON module with options
   * @param {object} options - Configuration options
   * @returns {DynamicModule} - Configured module
   */
  static forRoot(options = {}) {
    const config = { ...DEFAULT_CONFIG, ...options };

    const cacheProvider = config.cache
      ? {
          provide: 'TOON_CACHE',
          useValue: new CacheManager(config.cacheOptions)
        }
      : {
          provide: 'TOON_CACHE',
          useValue: null
        };

    const analyticsProvider = config.analytics
      ? {
          provide: 'TOON_ANALYTICS',
          useValue: new AnalyticsTracker(config.analyticsOptions)
        }
      : {
          provide: 'TOON_ANALYTICS',
          useValue: null
        };

    const loggerProvider = {
      provide: 'TOON_LOGGER',
      useValue: config.logger || baseLogger
    };

    const interceptorProvider = {
      provide: APP_INTERCEPTOR,
      useFactory: (cache, analytics, logger) => {
        return new ToonInterceptor(config, cache, analytics, logger);
      },
      inject: ['TOON_CACHE', 'TOON_ANALYTICS', 'TOON_LOGGER']
    };

    return {
      module: ToonModule,
      global: config.global || false,
      providers: [
        cacheProvider,
        analyticsProvider,
        loggerProvider,
        interceptorProvider
      ],
      exports: ['TOON_CACHE', 'TOON_ANALYTICS', 'TOON_LOGGER']
    };
  }

  /**
   * Configure the TOON module asynchronously
   * Useful for injecting ConfigService or other async dependencies
   * @param {object} options - Async configuration options
   * @returns {DynamicModule} - Configured module
   */
  static forRootAsync(options) {
    const cacheProvider = {
      provide: 'TOON_CACHE',
      useFactory: async (...args) => {
        const config = await options.useFactory(...args);
        return config.cache ? new CacheManager(config.cacheOptions) : null;
      },
      inject: options.inject || []
    };

    const analyticsProvider = {
      provide: 'TOON_ANALYTICS',
      useFactory: async (...args) => {
        const config = await options.useFactory(...args);
        return config.analytics ? new AnalyticsTracker(config.analyticsOptions) : null;
      },
      inject: options.inject || []
    };

    const loggerProvider = {
      provide: 'TOON_LOGGER',
      useFactory: async (...args) => {
        const config = await options.useFactory(...args);
        return config.logger || baseLogger;
      },
      inject: options.inject || []
    };

    const interceptorProvider = {
      provide: APP_INTERCEPTOR,
      useFactory: async (cache, analytics, logger, ...args) => {
        const config = await options.useFactory(...args);
        return new ToonInterceptor(config, cache, analytics, logger);
      },
      inject: ['TOON_CACHE', 'TOON_ANALYTICS', 'TOON_LOGGER', ...(options.inject || [])]
    };

    return {
      module: ToonModule,
      global: options.global || false,
      imports: options.imports || [],
      providers: [
        cacheProvider,
        analyticsProvider,
        loggerProvider,
        interceptorProvider
      ],
      exports: ['TOON_CACHE', 'TOON_ANALYTICS', 'TOON_LOGGER']
    };
  }
}
