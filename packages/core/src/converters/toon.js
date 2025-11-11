import { encode, decode } from '@toon-format/toon';
import { optimizeForTOON } from '../optimizers/index.js';
import { validateTOONOutput, validateDecodedData } from '../validators/index.js';

/**
 * @typedef {import('../../types/index.js').ConversionResult} ConversionResult
 */

/**
 * Pure function: Convert JSON data to TOON format
 * @param {unknown} data - JSON serialisable data
 * @param {Record<string, unknown>} [options] - Conversion options
 * @returns {ConversionResult}
 */
export function convertToTOON(data, options = {}) {
  try {
    if (data === null || data === undefined) {
      return {
        success: false,
        error: 'Cannot convert null or undefined to TOON',
        data: null
      };
    }

    const optimized = optimizeForTOON(data, options);
    const toonString = encode(optimized);
    const validation = validateTOONOutput(toonString);

    if (!validation.valid) {
      return {
        success: false,
        error: validation.error || 'TOON output failed validation',
        data: null
      };
    }

    const jsonString = JSON.stringify(data);

    return {
      success: true,
      data: toonString,
      originalSize: jsonString.length,
      convertedSize: toonString.length,
      compressionRatio: toonString.length / jsonString.length
    };
  } catch (error) {
    return {
      success: false,
      error: `TOON conversion failed: ${(error && error.message) || String(error)}`,
      data: null
    };
  }
}

/**
 * Pure function: Convert TOON string back to JSON
 * @param {string} toonString - TOON format string
 * @param {Record<string, unknown>} [options] - Parsing options
 * @returns {ConversionResult}
 */
export function convertFromTOON(toonString, options = {}) {
  try {
    if (typeof toonString !== 'string') {
      return {
        success: false,
        error: 'TOON input must be a string',
        data: null
      };
    }

    if (toonString.trim().length === 0) {
      return {
        success: false,
        error: 'TOON input cannot be empty',
        data: null
      };
    }

    const data = decode(toonString, options);
    const validation = validateDecodedData(data);

    if (!validation.valid) {
      return {
        success: false,
        error: validation.error || 'Decoded data failed validation',
        data: null
      };
    }

    return {
      success: true,
      data,
      originalSize: toonString.length,
      convertedSize: JSON.stringify(data).length
    };
  } catch (error) {
    return {
      success: false,
      error: `TOON parsing failed: ${(error && error.message) || String(error)}`,
      data: null
    };
  }
}

