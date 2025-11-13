import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { AnalyticsTracker } from '../src/adapters/analytics.js';

describe('AnalyticsTracker', () => {
  test('should emit conversion event with correct payload', (t, done) => {
    const tracker = new AnalyticsTracker({ enabled: true });

    const mockReq = {
      path: '/api/users',
      method: 'GET'
    };

    const mockSavings = {
      percentage: 42.5,
      tokens: 102,
      cost: 0.0002,
      original: { tokens: 240, size: 960 },
      converted: { tokens: 138, size: 552 },
      compressionRatio: 0.575
    };

    tracker.on('conversion', (payload) => {
      try {
        // Verify payload structure
        assert.ok(payload, 'Payload should exist');
        assert.equal(payload.path, '/api/users', 'Path should match');
        assert.equal(payload.method, 'GET', 'Method should match');
        assert.deepEqual(payload.savings, mockSavings, 'Savings should match');
        assert.ok(payload.timestamp, 'Timestamp should exist');
        assert.equal(typeof payload.timestamp, 'number', 'Timestamp should be a number');
        done();
      } catch (err) {
        done(err);
      }
    });

    tracker.trackConversion(mockReq, mockSavings);
  });

  test('should emit error event with correct payload', (t, done) => {
    const tracker = new AnalyticsTracker({ enabled: true });

    const mockError = new Error('Test error');
    const mockContext = {
      requestId: 'req-123',
      path: '/api/data'
    };

    tracker.on('error', (payload) => {
      try {
        assert.ok(payload, 'Payload should exist');
        assert.equal(payload.error, mockError, 'Error should match');
        assert.deepEqual(payload.context, mockContext, 'Context should match');
        assert.ok(payload.timestamp, 'Timestamp should exist');
        assert.equal(typeof payload.timestamp, 'number', 'Timestamp should be a number');
        done();
      } catch (err) {
        done(err);
      }
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

    const mockReq = { path: '/api/test', method: 'GET' };
    const mockSavings = { percentage: 50, tokens: 100 };
    const mockError = new Error('Test');

    tracker.trackConversion(mockReq, mockSavings);
    tracker.trackError(mockError);

    assert.equal(conversionCalled, false, 'Conversion event should not be emitted when disabled');
    assert.equal(errorCalled, false, 'Error event should not be emitted when disabled');
  });

  test('should support multiple event listeners', (t, done) => {
    const tracker = new AnalyticsTracker({ enabled: true });

    let listener1Called = false;
    let listener2Called = false;

    tracker.on('conversion', () => {
      listener1Called = true;
      checkComplete();
    });

    tracker.on('conversion', () => {
      listener2Called = true;
      checkComplete();
    });

    function checkComplete() {
      if (listener1Called && listener2Called) {
        assert.ok(listener1Called, 'First listener should be called');
        assert.ok(listener2Called, 'Second listener should be called');
        done();
      }
    }

    const mockReq = { path: '/test', method: 'POST' };
    const mockSavings = { percentage: 30 };

    tracker.trackConversion(mockReq, mockSavings);
  });

  test('should default to enabled when no options provided', () => {
    const tracker = new AnalyticsTracker();

    assert.equal(tracker.options.enabled, true, 'Should be enabled by default');
  });

  test('should accept custom options', () => {
    const customOptions = {
      enabled: false,
      customField: 'custom-value'
    };

    const tracker = new AnalyticsTracker(customOptions);

    assert.equal(tracker.options.enabled, false, 'Should respect custom enabled option');
    assert.equal(tracker.options.customField, 'custom-value', 'Should preserve custom options');
  });

  test('should handle trackError without context', (t, done) => {
    const tracker = new AnalyticsTracker({ enabled: true });

    const mockError = new Error('No context error');

    tracker.on('error', (payload) => {
      try {
        assert.ok(payload, 'Payload should exist');
        assert.equal(payload.error, mockError, 'Error should match');
        assert.deepEqual(payload.context, {}, 'Context should be empty object');
        assert.ok(payload.timestamp, 'Timestamp should exist');
        done();
      } catch (err) {
        done(err);
      }
    });

    tracker.trackError(mockError);
  });

  test('should emit events in correct order for multiple conversions', (t, done) => {
    const tracker = new AnalyticsTracker({ enabled: true });

    const events = [];
    const expectedPaths = ['/api/first', '/api/second', '/api/third'];

    tracker.on('conversion', (payload) => {
      events.push(payload.path);

      if (events.length === 3) {
        try {
          assert.deepEqual(events, expectedPaths, 'Events should be emitted in order');
          done();
        } catch (err) {
          done(err);
        }
      }
    });

    expectedPaths.forEach(path => {
      tracker.trackConversion({ path, method: 'GET' }, { percentage: 40 });
    });
  });
});
