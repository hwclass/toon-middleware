import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { convertToTOON, convertFromTOON } from '../src/converters/toon.js';
import { calculateSavings } from '../src/analytics/tokens.js';

describe('Pure Functions: TOON Converters', () => {
  test('convertToTOON should be pure - same input, same output', () => {
    const data = { message: 'Hello World', count: 42 };

    const result1 = convertToTOON(data);
    const result2 = convertToTOON(data);
    const result3 = convertToTOON(data);

    assert.deepEqual(result1, result2);
    assert.deepEqual(result2, result3);
  });

  test('convertToTOON should not mutate input', () => {
    const originalData = { items: [1, 2, 3], nested: { value: 'test' } };
    const dataCopy = JSON.parse(JSON.stringify(originalData));

    convertToTOON(originalData);

    assert.deepEqual(originalData, dataCopy);
  });

  test('convertFromTOON should return original data for valid TOON string', () => {
    const original = { message: 'Hello', id: 1 };
    const converted = convertToTOON(original);

    assert.equal(converted.success, true);

    const decoded = convertFromTOON(converted.data);

    assert.equal(decoded.success, true);
    assert.deepEqual(decoded.data, original);
  });

  test('calculateSavings should be deterministic', () => {
    const json = '{"users":[{"id":1,"name":"Alice"}]}';
    const toon = '[[1,"Alice"]]';

    const result1 = calculateSavings(json, toon);
    const result2 = calculateSavings(json, toon);

    assert.equal(result1.savings.percentage, result2.savings.percentage);
    assert.equal(result1.savings.tokens, result2.savings.tokens);
  });
});

