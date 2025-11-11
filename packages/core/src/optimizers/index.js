/**
 * @typedef {import('../../types/index.js').OptimizationOptions} OptimizationOptions
 */

/**
 * Pure function: Optimise data structure for TOON conversion
 * @template T
 * @param {T} data
 * @param {OptimizationOptions} [options]
 * @returns {T}
 */
export function optimizeForTOON(data, options = {}) {
  if (Array.isArray(data)) {
    return /** @type {T} */ (optimizeArray(data, options));
  }

  if (isPlainObject(data)) {
    return /** @type {T} */ (optimizeObject(data, options));
  }

  if (typeof data === 'string') {
    return /** @type {T} */ (normalizeString(data, options));
  }

  return data;
}

/**
 * Pure function: Optimise array contents
 * @template T
 * @param {T[]} collection
 * @param {OptimizationOptions} [options]
 * @returns {T[]}
 */
export function optimizeArray(collection, options = {}) {
  const dedupe = options.dedupeArrays ?? true;
  const normalised = collection
    .map(item => optimizeForTOON(item, options))
    .filter(item => item !== undefined);

  if (!dedupe) {
    return normalised;
  }

  const seen = new Set();
  const result = [];

  for (const item of normalised) {
    const key = stableStringify(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }

  return result;
}

/**
 * Pure function: Optimise plain object contents
 * @param {Record<string, unknown>} value
 * @param {OptimizationOptions} [options]
 * @returns {Record<string, unknown>}
 */
export function optimizeObject(value, options = {}) {
  const entries = Object.entries(value)
    .filter(([_, val]) => val !== undefined)
    .map(([key, val]) => [
      key,
      optimizeForTOON(val, options)
    ]);

  if (options.sortKeys ?? true) {
    entries.sort(([a], [b]) => a.localeCompare(b));
  }

  if (options.compactBooleans) {
    return entries.reduce((acc, [key, val]) => {
      acc[key] = typeof val === 'boolean' ? Number(val) : val;
      return acc;
    }, {});
  }

  return entries.reduce((acc, [key, val]) => {
    acc[key] = val;
    return acc;
  }, {});
}

function normalizeString(value, options) {
  if (!options || options.trimStrings === false) {
    return value;
  }

  const trimmed = value.trim();
  if (options.maxStringLength && trimmed.length > options.maxStringLength) {
    return trimmed.slice(0, options.maxStringLength);
  }

  return trimmed;
}

function stableStringify(value) {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  const entries = Object.entries(value).sort(([a], [b]) => a.localeCompare(b));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(',')}}`;
}

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    (value.constructor === Object || Object.getPrototypeOf(value) === null)
  );
}

