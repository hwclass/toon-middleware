import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';

import { createExpressToonMiddleware } from '../src/middleware.js';

describe('Imperative Shell: Express Integration', () => {
  test('should handle full request-response cycle with side effects', async () => {
    const app = express();
    app.use(express.json());
    app.use(createExpressToonMiddleware());

    app.get('/api/data', (req, res) => {
      res.json({
        users: [
          { id: 1, name: 'Alice', email: 'alice@example.com' },
          { id: 2, name: 'Bob', email: 'bob@example.com' }
        ],
        metadata: { total: 2, page: 1 }
      });
    });

    const response = await request(app)
      .get('/api/data')
      .set('User-Agent', 'OpenAI-API-Client/1.0')
      .set('Accept', 'application/json, text/toon')
      .set('X-Accept-Toon', 'true')
      .expect(200);

    assert.ok(response.headers['x-toon-savings']);
    assert.ok(response.headers['x-toon-tokens']);
    assert.ok(response.headers['x-request-id']);
    assert.equal(response.headers['content-type'], 'text/plain; charset=utf-8');
    // Response should be in TOON format (not JSON)
    assert.ok(response.text.length > 0, 'Response should have content');
    assert.ok(!response.text.startsWith('{'), 'Response should not be JSON');
    assert.ok(response.text.includes('users'), 'Response should contain users data');
  });

  test('should emit analytics conversion event when analytics is enabled', (t, done) => {
    const middleware = createExpressToonMiddleware({
      analytics: true,
      analyticsOptions: { enabled: true }
    });

    const app = express();
    app.use(express.json());
    app.use(middleware);

    app.get('/api/users', (req, res) => {
      res.json({
        users: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' }
        ]
      });
    });

    // Listen for analytics event
    middleware.analytics.on('conversion', (payload) => {
      try {
        assert.ok(payload, 'Payload should exist');
        assert.equal(payload.path, '/api/users', 'Path should be /api/users');
        assert.equal(payload.method, 'GET', 'Method should be GET');
        assert.ok(payload.savings, 'Savings data should exist');
        assert.ok(payload.savings.percentage, 'Savings percentage should exist');
        assert.ok(payload.savings.tokens, 'Token savings should exist');
        assert.ok(payload.timestamp, 'Timestamp should exist');
        done();
      } catch (err) {
        done(err);
      }
    });

    // Make request
    request(app)
      .get('/api/users')
      .set('User-Agent', 'OpenAI-API-Client/1.0')
      .set('Accept', 'application/json, text/toon')
      .set('X-Accept-Toon', 'true')
      .expect(200)
      .end((err) => {
        if (err) done(err);
      });
  });

  test('should not emit analytics events when analytics is disabled', async () => {
    const middleware = createExpressToonMiddleware({
      analytics: false
    });

    const app = express();
    app.use(express.json());
    app.use(middleware);

    app.get('/api/test', (req, res) => {
      res.json({ data: 'test' });
    });

    // Verify analytics is null/undefined
    assert.ok(!middleware.analytics, 'Analytics should be disabled');

    await request(app)
      .get('/api/test')
      .set('User-Agent', 'OpenAI-API-Client/1.0')
      .set('Accept', 'application/json, text/toon')
      .set('X-Accept-Toon', 'true')
      .expect(200);

    // Test passes if no errors occur
  });

  test('should include correct savings data in analytics event', (t, done) => {
    const middleware = createExpressToonMiddleware({
      analytics: true,
      pricing: { per1K: 0.002 }
    });

    const app = express();
    app.use(express.json());
    app.use(middleware);

    app.get('/api/products', (req, res) => {
      res.json({
        products: [
          { id: 1, name: 'Product A', price: 99.99 },
          { id: 2, name: 'Product B', price: 149.99 },
          { id: 3, name: 'Product C', price: 199.99 }
        ]
      });
    });

    middleware.analytics.on('conversion', (payload) => {
      try {
        const { savings } = payload;

        assert.ok(savings.percentage >= 0, 'Percentage should be non-negative');
        assert.ok(savings.tokens > 0, 'Token savings should be positive');
        assert.ok(savings.cost >= 0, 'Cost savings should be non-negative');
        assert.ok(savings.original, 'Original metrics should exist');
        assert.ok(savings.converted, 'Converted metrics should exist');
        assert.ok(savings.original.tokens > savings.converted.tokens, 'Should save tokens');
        assert.ok(savings.compressionRatio > 0 && savings.compressionRatio < 1, 'Compression ratio should be between 0 and 1');

        done();
      } catch (err) {
        done(err);
      }
    });

    request(app)
      .get('/api/products')
      .set('User-Agent', 'claude-api-client')
      .set('Accept', 'application/json, text/toon')
      .set('X-Accept-Toon', 'true')
      .expect(200)
      .end((err) => {
        if (err) done(err);
      });
  });

  test('should handle multiple requests with analytics', (t, done) => {
    const middleware = createExpressToonMiddleware({
      analytics: true
    });

    const app = express();
    app.use(express.json());
    app.use(middleware);

    app.get('/api/endpoint1', (req, res) => {
      res.json({ data: [{ id: 1 }, { id: 2 }] });
    });

    app.get('/api/endpoint2', (req, res) => {
      res.json({ items: [{ name: 'A' }, { name: 'B' }] });
    });

    const receivedEvents = [];

    middleware.analytics.on('conversion', (payload) => {
      receivedEvents.push(payload.path);

      if (receivedEvents.length === 2) {
        try {
          assert.ok(receivedEvents.includes('/api/endpoint1'), 'Should track endpoint1');
          assert.ok(receivedEvents.includes('/api/endpoint2'), 'Should track endpoint2');
          done();
        } catch (err) {
          done(err);
        }
      }
    });

    // Make both requests
    Promise.all([
      request(app)
        .get('/api/endpoint1')
        .set('User-Agent', 'gpt-4-client')
        .set('X-Accept-Toon', 'true'),
      request(app)
        .get('/api/endpoint2')
        .set('User-Agent', 'mistral-client')
        .set('X-Accept-Toon', 'true')
    ]).catch(done);
  });

  test('should not emit analytics for non-LLM clients', async () => {
    let eventEmitted = false;

    const middleware = createExpressToonMiddleware({
      analytics: true
    });

    const app = express();
    app.use(express.json());
    app.use(middleware);

    app.get('/api/browser', (req, res) => {
      res.json({ message: 'hello' });
    });

    middleware.analytics.on('conversion', () => {
      eventEmitted = true;
    });

    await request(app)
      .get('/api/browser')
      .set('User-Agent', 'Mozilla/5.0')
      .expect(200);

    // Give event loop time to process any events
    await new Promise(resolve => setTimeout(resolve, 100));

    assert.equal(eventEmitted, false, 'Analytics event should not be emitted for browser clients');
  });

  test('should handle analytics with custom configuration', (t, done) => {
    const customOptions = {
      enabled: true,
      customField: 'custom-value'
    };

    const middleware = createExpressToonMiddleware({
      analytics: true,
      analyticsOptions: customOptions
    });

    const app = express();
    app.use(express.json());
    app.use(middleware);

    app.get('/api/custom', (req, res) => {
      res.json({ test: 'data' });
    });

    assert.equal(middleware.analytics.options.customField, 'custom-value', 'Custom options should be passed');

    middleware.analytics.on('conversion', () => {
      done();
    });

    request(app)
      .get('/api/custom')
      .set('User-Agent', 'llama-api')
      .set('X-Accept-Toon', 'true')
      .expect(200)
      .end((err) => {
        if (err) done(err);
      });
  });
});

