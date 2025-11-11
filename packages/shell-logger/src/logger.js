const levels = ['error', 'warn', 'info', 'debug', 'trace'];

function createLogger(level = 'info', transport = console) {
  const threshold = levels.indexOf(level);

  const ensureLevel = name => {
    const idx = levels.indexOf(name);
    return idx === -1 ? levels.indexOf('info') : idx;
  };

  const shouldLog = name => ensureLevel(name) <= threshold;

  return {
    setLevel(newLevel) {
      if (levels.includes(newLevel)) {
        this.level = newLevel;
      }
    },
    level,
    error(message, context = {}) {
      if (shouldLog('error')) {
        transport.error(formatMessage('error', message, context));
      }
    },
    warn(message, context = {}) {
      if (shouldLog('warn')) {
        transport.warn(formatMessage('warn', message, context));
      }
    },
    info(message, context = {}) {
      if (shouldLog('info')) {
        transport.info(formatMessage('info', message, context));
      }
    },
    debug(message, context = {}) {
      if (shouldLog('debug')) {
        transport.debug?.(formatMessage('debug', message, context)) ??
          transport.log(formatMessage('debug', message, context));
      }
    },
    trace(message, context = {}) {
      if (shouldLog('trace')) {
        transport.trace?.(formatMessage('trace', message, context)) ??
          transport.log(formatMessage('trace', message, context));
      }
    }
  };
}

function formatMessage(level, message, context) {
  const metadata = Object.keys(context).length > 0 ? ` ${JSON.stringify(context)}` : '';
  return `[toon-middleware][${level}] ${message}${metadata}`;
}

export const logger = createLogger();
export { createLogger };

