import { describe, test } from 'node:test';
import assert from 'node:assert';
import Fastify from 'fastify';
import toonPlugin from '../src/plugin.js';

describe('Fastify TOON Plugin', () => {
  test('should convert response to TOON for LLM clients', async () => {
    const fastify = Fastify();

    await fastify.register(toonPlugin, {
      autoConvert: true,
      cache: false,
      analytics: false
    });

    fastify.get('/api/users', async () => {
      return {
        users: [
          { id: 1, name: 'Alice', role: 'admin' },
          { id: 2, name: 'Bob', role: 'user' }
        ]
      };
    });

    const response = await fastify.inject({
      method: 'GET',
      url: '/api/users',
      headers: {
        'user-agent': 'OpenAI/1.0',
        'accept': 'text/plain'
      }
    });

    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(response.headers['x-toon-mode'], 'toon');
    assert.ok(response.headers['x-toon-savings']);
    assert.ok(response.body.includes('users[2]{id,name,role}'));

    await fastify.close();
  });

  test('should passthrough for non-LLM clients', async () => {
    const fastify = Fastify();

    await fastify.register(toonPlugin, {
      autoConvert: true
    });

    fastify.get('/api/users', async () => {
      return {
        users: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' }
        ]
      };
    });

    const response = await fastify.inject({
      method: 'GET',
      url: '/api/users',
      headers: {
        'user-agent': 'Mozilla/5.0'
      }
    });

    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(response.headers['x-toon-mode'], 'passthrough');

    const data = JSON.parse(response.body);
    assert.ok(Array.isArray(data.users));
    assert.strictEqual(data.users.length, 2);

    await fastify.close();
  });

  test('should emit analytics conversion event when enabled', async (t, done) => {
    const fastify = Fastify();

    await fastify.register(toonPlugin, {
      autoConvert: true,
      analytics: true
    });

    fastify.get('/api/data', async () => {
      return { items: [{ id: 1 }, { id: 2 }] };
    });

    // Access analytics via decorated property
    fastify.toonAnalytics.on('conversion', (payload) => {
      assert.ok(payload.savings);
      assert.ok(payload.requestId);
      assert.strictEqual(payload.clientType, 'LLM');
      done();
    });

    await fastify.inject({
      method: 'GET',
      url: '/api/data',
      headers: {
        'user-agent': 'Anthropic Claude/1.0'
      }
    });

    await fastify.close();
  });

  test('should not emit analytics events when analytics is disabled', async () => {
    const fastify = Fastify();

    await fastify.register(toonPlugin, {
      autoConvert: true,
      analytics: false
    });

    fastify.get('/api/data', async () => {
      return { items: [] };
    });

    let eventEmitted = false;

    // Plugin should not have toonAnalytics when disabled
    if (fastify.toonAnalytics) {
      fastify.toonAnalytics.on('conversion', () => {
        eventEmitted = true;
      });
    }

    await fastify.inject({
      method: 'GET',
      url: '/api/data',
      headers: {
        'user-agent': 'OpenAI/1.0'
      }
    });

    await fastify.close();

    assert.strictEqual(eventEmitted, false);
  });

  test('should include correct savings data in analytics event', async (t, done) => {
    const fastify = Fastify();

    await fastify.register(toonPlugin, {
      autoConvert: true,
      analytics: true
    });

    fastify.get('/api/users', async () => {
      return {
        users: [
          { id: 1, name: 'Alice', email: 'alice@example.com' },
          { id: 2, name: 'Bob', email: 'bob@example.com' }
        ]
      };
    });

    fastify.toonAnalytics.on('conversion', (payload) => {
      const { savings } = payload;
      assert.ok(savings.percentage >= 0);
      assert.ok(savings.tokens > 0);
      assert.ok(payload.original.tokens > payload.converted.tokens);
      assert.ok(savings.compressionRatio > 1);
      done();
    });

    await fastify.inject({
      method: 'GET',
      url: '/api/users',
      headers: {
        'user-agent': 'Anthropic Claude/1.0',
        'accept': 'text/plain'
      }
    });

    await fastify.close();
  });

  test('should handle errors gracefully', async () => {
    const fastify = Fastify();

    await fastify.register(toonPlugin, {
      autoConvert: true
    });

    fastify.get('/api/error', async () => {
      // Return non-serializable data
      const circular = {};
      circular.self = circular;
      return circular;
    });

    const response = await fastify.inject({
      method: 'GET',
      url: '/api/error',
      headers: {
        'user-agent': 'OpenAI/1.0'
      }
    });

    // Should fallback gracefully
    assert.strictEqual(response.statusCode, 500); // Fastify handles circular refs as error

    await fastify.close();
  });

  test('should work with custom configuration', async () => {
    const fastify = Fastify();

    await fastify.register(toonPlugin, {
      autoConvert: true,
      confidenceThreshold: 0.9,
      pricing: {
        per1K: 0.005
      }
    });

    fastify.get('/api/test', async () => {
      return { message: 'test' };
    });

    const response = await fastify.inject({
      method: 'GET',
      url: '/api/test',
      headers: {
        'user-agent': 'OpenAI/1.0'
      }
    });

    assert.strictEqual(response.statusCode, 200);
    assert.ok(response.headers['x-toon-mode']);

    await fastify.close();
  });
});
