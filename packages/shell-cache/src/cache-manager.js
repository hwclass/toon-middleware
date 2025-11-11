import { EventEmitter } from 'node:events';
import { createHash } from 'node:crypto';

/**
 * Imperative Shell: Cache manager with side effects
 * Handles storage, eviction, and cache lifecycle
 */
export class CacheManager extends EventEmitter {
  constructor(options = {}) {
    super();

    this.options = {
      maxSize: 1000,
      ttl: 300000,
      checkPeriod: 60000,
      storage: 'memory',
      ...options
    };

    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0
    };

    this.startCleanup();
  }

  generateKey(request, data) {
    try {
      const keyData = {
        url: request.url,
        method: request.method,
        userAgent: request.headers?.['user-agent'],
        dataHash: this.hashData(data)
      };

      return createHash('sha256').update(JSON.stringify(keyData)).digest('hex');
    } catch (error) {
      this.emit('error', new Error(`Key generation failed: ${error.message}`));
      return null;
    }
  }

  hashData(data) {
    try {
      const dataString =
        typeof data === 'string' ? data : JSON.stringify(data);
      return createHash('sha256').update(dataString).digest('hex');
    } catch {
      return null;
    }
  }

  get(key) {
    if (!key) return null;

    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses += 1;
      this.emit('miss', key);
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses += 1;
      this.emit('expired', key);
      return null;
    }

    entry.accessCount += 1;
    this.stats.hits += 1;
    this.emit('hit', key);

    return entry.value;
  }

  set(key, value, ttl = this.options.ttl) {
    if (!key) return false;

    if (this.cache.size >= this.options.maxSize) {
      this.evictOldest();
    }

    const entry = {
      value,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttl,
      accessCount: 0
    };

    this.cache.set(key, entry);
    this.stats.sets += 1;
    this.emit('set', key);

    return true;
  }

  evictOldest() {
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions += 1;
      this.emit('evicted', oldestKey);
    }
  }

  startCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.options.checkPeriod).unref?.();
  }

  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned += 1;
      }
    }

    if (cleaned > 0) {
      this.emit('cleanup', cleaned);
    }
  }

  clear() {
    const size = this.cache.size;
    this.cache.clear();
    this.emit('cleared', size);
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.clear();
    this.removeAllListeners();
  }
}

