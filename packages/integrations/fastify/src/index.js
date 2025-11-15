/**
 * @toon-middleware/fastify
 * Fastify plugin for TOON middleware
 */

export { default as toonPlugin } from './plugin.js';
export { AnalyticsTracker } from './adapters/analytics.js';

// Default export for convenience
export { default } from './plugin.js';
