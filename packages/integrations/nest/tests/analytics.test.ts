import { describe, test } from 'node:test';
import assert from 'node:assert';
import { AnalyticsTracker } from '../src/adapters/analytics.tracker.js';

describe('AnalyticsTracker', () => {
  test('should emit conversion event with correct payload', (t, done) => {
    const tracker = new AnalyticsTracker();

    const mockRequest = {
      headers: {
        'x-request-id': 'test-123',
        'user-agent': 'OpenAI/1.0'
      },
      url: '/api/test',
      method: 'GET',
      clientInfo: { type: 'LLM' }
    };

    const mockSavings = {
      savings: {
        percentage: 45.5,
        tokens: 100,
        cost: 0.002,
        compressionRatio: 1.8
      },
      original: {
        tokens: 220,
        size: 1000
      },
      converted: {
        tokens: 120,
        size: 550
      }
    };

    tracker.on('conversion', (payload) => {
      assert.strictEqual(payload.requestId, 'test-123');
      assert.strictEqual(payload.path, '/api/test');
      assert.strictEqual(payload.method, 'GET');
      assert.strictEqual(payload.clientType, 'LLM');
      assert.strictEqual(payload.savings.percentage, 45.5);
      assert.strictEqual(payload.savings.tokens, 100);
      assert.ok(payload.timestamp);
      done();
    });

    tracker.trackConversion(mockRequest, mockSavings);
  });

  test('should emit error event with correct payload', (t, done) => {
    const tracker = new AnalyticsTracker();

    const mockError = new Error('Test error');
    const mockContext = { requestId: 'test-456' };

    tracker.on('error', (payload) => {
      assert.strictEqual(payload.error.message, 'Test error');
      assert.strictEqual(payload.error.name, 'Error');
      assert.strictEqual(payload.context.requestId, 'test-456');
      assert.ok(payload.timestamp);
      done();
    });

    tracker.trackError(mockError, mockContext);
  });

  test('should not emit events when analytics is disabled', () => {
    const tracker = new AnalyticsTracker({ enabled: false });
    let conversionCalled = false;
    let errorCalled = false;

    tracker.on('conversion', () => {
      conversionCalled = true;
    });

    tracker.on('error', () => {
      errorCalled = true;
    });

    tracker.trackConversion({}, {});
    tracker.trackError(new Error('test'));

    assert.strictEqual(conversionCalled, false);
    assert.strictEqual(errorCalled, false);
  });

  test('should support multiple event listeners', (t, done) => {
    const tracker = new AnalyticsTracker();
    let listener1Called = false;
    let listener2Called = false;

    tracker.on('conversion', () => {
      listener1Called = true;
    });

    tracker.on('conversion', () => {
      listener2Called = true;
      assert.strictEqual(listener1Called, true);
      assert.strictEqual(listener2Called, true);
      done();
    });

    tracker.trackConversion({
      headers: {},
      clientInfo: {}
    }, {
      savings: {},
      original: {},
      converted: {}
    });
  });

  test('should default to enabled when no options provided', () => {
    const tracker = new AnalyticsTracker();
    assert.strictEqual(tracker.enabled, true);
  });

  test('should accept custom options', () => {
    const tracker = new AnalyticsTracker({ enabled: false });
    assert.strictEqual(tracker.enabled, false);
  });

  test('should handle trackError without context', (t, done) => {
    const tracker = new AnalyticsTracker();

    tracker.on('error', (payload) => {
      assert.strictEqual(payload.error.message, 'Test error');
      assert.deepStrictEqual(payload.context, {});
      done();
    });

    tracker.trackError(new Error('Test error'));
  });

  test('should emit events in correct order for multiple conversions', (t, done) => {
    const tracker = new AnalyticsTracker();
    const events = [];

    tracker.on('conversion', (payload) => {
      events.push(payload.requestId);

      if (events.length === 3) {
        assert.deepStrictEqual(events, ['req-1', 'req-2', 'req-3']);
        done();
      }
    });

    for (let i = 1; i <= 3; i++) {
      tracker.trackConversion({
        headers: { 'x-request-id': `req-${i}` },
        clientInfo: {}
      }, {
        savings: {},
        original: {},
        converted: {}
      });
    }
  });
});
