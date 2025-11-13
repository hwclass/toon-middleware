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

