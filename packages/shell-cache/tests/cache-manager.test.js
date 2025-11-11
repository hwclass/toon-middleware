import { test } from 'node:test';
import assert from 'node:assert/strict';

import { CacheManager } from '../src/cache-manager.js';

test('CacheManager should store and retrieve values with TTL', async () => {
  const cache = new CacheManager({ ttl: 100 });
  const key = cache.generateKey(
    { url: '/test', method: 'GET', headers: {} },
    { message: 'hello' }
  );

  cache.set(key, { value: 123 });
  const hit = cache.get(key);

  assert.ok(hit);
  assert.equal(hit.value, 123);

  cache.destroy();
});

