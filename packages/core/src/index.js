export { convertToTOON, convertFromTOON } from './converters/index.js';
export {
  detectClient,
  createUserAgentDetector,
  createHeaderDetector
} from './detectors/index.js';
export { calculateSavings, estimateTokens } from './analytics/index.js';
export {
  optimizeForTOON,
  optimizeArray,
  optimizeObject
} from './optimizers/index.js';
export {
  validateTOONOutput,
  validateDecodedData,
  isValidTOONString
} from './validators/index.js';

export const ClientType = Object.freeze({
  LLM: 'LLM',
  REGULAR: 'regular'
});

export const SavingsInfo = Object.freeze({
  tokens: 0,
  percentage: 0,
  cost: 0,
  spaceEfficiency: 0
});

export const ConversionResult = Object.freeze({
  success: false,
  data: null,
  error: null,
  originalSize: 0,
  convertedSize: 0,
  compressionRatio: 1
});

