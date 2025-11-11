import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  generateRequestId,
  isLLMConfidenceHigh,
  wantsToonResponse
} from '../src/index.js';

test('generateRequestId creates unique ids', () => {
  const id1 = generateRequestId('test');
  const id2 = generateRequestId('test');
  assert.notEqual(id1, id2);
});

test('isLLMConfidenceHigh validates threshold', () => {
  const result = isLLMConfidenceHigh({ type: 'LLM', confidence: 0.9 }, 0.8);
  assert.equal(result, true);
});

test('wantsToonResponse detects accept headers', () => {
  const result = wantsToonResponse({ accept: 'application/json; q=0.9, text/toon' });
  assert.equal(result, true);
});

