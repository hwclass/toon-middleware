import { describe, test } from 'node:test';
import assert from 'node:assert';
import { Test } from '@nestjs/testing';
import { Controller, Get, INestApplication } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import request from 'supertest';
import { ToonInterceptor } from '../src/toon.interceptor.js';
import { AnalyticsTracker } from '../src/adapters/analytics.tracker.js';

// Test controller
@Controller()
class TestController {
  @Get('/api/users')
  getUsers() {
    return [
      { id: 1, name: 'Alice', role: 'admin' },
      { id: 2, name: 'Bob', role: 'user' }
    ];
  }

  @Get('/api/health')
  getHealth() {
    return { status: 'ok' };
  }
}

describe('ToonInterceptor Integration', () => {
  test('should convert response to TOON for LLM clients', async () => {
    const analytics = new AnalyticsTracker();
    const interceptor = new ToonInterceptor(
      { autoConvert: true },
      null,
      analytics,
      null
    );

    const moduleRef = await Test.createTestingModule({
      controllers: [TestController],
      providers: [
        {
          provide: APP_INTERCEPTOR,
          useValue: interceptor
        }
      ]
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    const response = await request(app.getHttpServer())
      .get('/api/users')
      .set('User-Agent', 'OpenAI/1.0')
      .set('Accept', 'text/plain')
      .expect(200);

    assert.strictEqual(response.headers['x-toon-mode'], 'toon');
    assert.ok(response.headers['x-toon-savings']);
    assert.ok(response.text.includes('users[2]{id,name,role}'));

    await app.close();
  });

  test('should emit analytics conversion event when enabled', async (t, done) => {
    const analytics = new AnalyticsTracker();
    const interceptor = new ToonInterceptor(
      { autoConvert: true },
      null,
      analytics,
      null
    );

    analytics.on('conversion', (payload) => {
      assert.ok(payload.savings);
      assert.ok(payload.requestId);
      assert.strictEqual(payload.clientType, 'LLM');
      done();
    });

    const moduleRef = await Test.createTestingModule({
      controllers: [TestController],
      providers: [
        {
          provide: APP_INTERCEPTOR,
          useValue: interceptor
        }
      ]
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .get('/api/users')
      .set('User-Agent', 'OpenAI/1.0')
      .set('Accept', 'text/plain');

    await app.close();
  });

  test('should not emit analytics events when analytics is disabled', async () => {
    const analytics = new AnalyticsTracker({ enabled: false });
    const interceptor = new ToonInterceptor(
      { autoConvert: true },
      null,
      analytics,
      null
    );

    let eventEmitted = false;
    analytics.on('conversion', () => {
      eventEmitted = true;
    });

    const moduleRef = await Test.createTestingModule({
      controllers: [TestController],
      providers: [
        {
          provide: APP_INTERCEPTOR,
          useValue: interceptor
        }
      ]
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .get('/api/users')
      .set('User-Agent', 'OpenAI/1.0')
      .set('Accept', 'text/plain')
      .expect(200);

    await app.close();

    assert.strictEqual(eventEmitted, false);
  });

  test('should passthrough for non-LLM clients', async () => {
    const interceptor = new ToonInterceptor({ autoConvert: true }, null, null, null);

    const moduleRef = await Test.createTestingModule({
      controllers: [TestController],
      providers: [
        {
          provide: APP_INTERCEPTOR,
          useValue: interceptor
        }
      ]
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    const response = await request(app.getHttpServer())
      .get('/api/users')
      .set('User-Agent', 'Mozilla/5.0')
      .expect(200);

    assert.strictEqual(response.headers['x-toon-mode'], 'passthrough');
    assert.strictEqual(typeof response.body, 'object');
    assert.strictEqual(Array.isArray(response.body), true);

    await app.close();
  });

  test('should include correct savings data in analytics event', async (t, done) => {
    const analytics = new AnalyticsTracker();
    const interceptor = new ToonInterceptor(
      { autoConvert: true },
      null,
      analytics,
      null
    );

    analytics.on('conversion', (payload) => {
      const { savings } = payload;
      assert.ok(savings.percentage >= 0);
      assert.ok(savings.tokens > 0);
      assert.ok(payload.original.tokens > payload.converted.tokens);
      assert.ok(savings.compressionRatio > 1);
      done();
    });

    const moduleRef = await Test.createTestingModule({
      controllers: [TestController],
      providers: [
        {
          provide: APP_INTERCEPTOR,
          useValue: interceptor
        }
      ]
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .get('/api/users')
      .set('User-Agent', 'Anthropic Claude/1.0')
      .set('Accept', 'text/plain');

    await app.close();
  });
});
