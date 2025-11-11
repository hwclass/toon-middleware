/**
 * @typedef {import('../../types/index.js').ValidationResult} ValidationResult
 */

/**
 * Validate TOON encoded string
 * @param {unknown} toonString
 * @returns {ValidationResult}
 */
export function validateTOONOutput(toonString) {
  if (typeof toonString !== 'string' || toonString.trim().length === 0) {
    return { valid: false, error: 'TOON output cannot be empty' };
  }
  return { valid: true };
}

/**
 * Validate decoded TOON data
 * @param {unknown} data
 * @returns {ValidationResult}
 */
export function validateDecodedData(data) {
  if (data === undefined) {
    return {
      valid: false,
      error: 'Decoded data cannot be undefined'
    };
  }

  if (typeof data === 'number' && !Number.isFinite(data)) {
    return {
      valid: false,
      error: 'Decoded number must be finite'
    };
  }

  if (Array.isArray(data) && data.length === 0) {
    return {
      valid: false,
      error: 'Decoded array cannot be empty'
    };
  }

  return { valid: true };
}

/**
 * Check if a value can be considered a TOON string
 * @param {unknown} value
 * @returns {boolean}
 */
export function isValidTOONString(value) {
  return validateTOONOutput(value).valid;
}

