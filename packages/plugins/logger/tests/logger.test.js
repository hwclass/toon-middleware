import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createLogger } from '../src/logger.js';

test('createLogger respects log level', () => {
  const entries = [];
  const transport = {
    error: message => entries.push(['error', message]),
    warn: message => entries.push(['warn', message]),
    info: message => entries.push(['info', message]),
    debug: message => entries.push(['debug', message]),
    trace: message => entries.push(['trace', message])
  };

  const logger = createLogger('warn', transport);
  logger.info('should not log');
  logger.error('should log');

  assert.equal(entries.length, 1);
  assert.equal(entries[0][0], 'error');
});

