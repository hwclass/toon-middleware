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
    assert.ok(response.text.startsWith('[') || response.text.startsWith('{'));
  });
});

