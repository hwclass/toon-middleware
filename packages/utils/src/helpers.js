import { REQUEST_ID_PREFIX } from './constants.js';

export function generateRequestId(source = REQUEST_ID_PREFIX) {
  const time = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  return `${source}_${time}_${random}`;
}

export function measureDuration(startTime) {
  const end = process.hrtime.bigint();
  return Number(end - startTime) / 1_000_000;
}

export function toBigIntTime() {
  return process.hrtime.bigint();
}

export function safeJsonStringify(value) {
  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
}

export function isJsonSerializable(value) {
  if (value === undefined) return false;
  if (typeof value === 'function') return false;

  try {
    JSON.stringify(value);
    return true;
  } catch {
    return false;
  }
}

