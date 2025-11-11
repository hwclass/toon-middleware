export const HEADER_NAMES = Object.freeze({
  acceptToon: 'x-accept-toon',
  toonSavings: 'x-toon-savings',
  toonTokens: 'x-toon-tokens',
  toonCostSaved: 'x-toon-cost-saved',
  requestId: 'x-request-id',
  toonError: 'x-toon-error'
});

export const DEFAULT_CONFIG = Object.freeze({
  autoConvert: true,
  cache: true,
  analytics: true,
  logLevel: 'info',
  timeout: 30000,
  maxRequestSize: '1mb'
});

export const REQUEST_ID_PREFIX = 'req';

