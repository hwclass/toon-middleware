# @toon-middleware/fastify

Fastify plugin for TOON middleware - Automatic token optimization for LLM API responses.

## Installation

```bash
npm install @toon-middleware/fastify
# or
pnpm add @toon-middleware/fastify
# or
yarn add @toon-middleware/fastify
```

## Quick Start

### 1. Register the plugin

```javascript
import Fastify from 'fastify';
import toonPlugin from '@toon-middleware/fastify';

const fastify = Fastify({ logger: true });

// Register TOON plugin
await fastify.register(toonPlugin, {
  autoConvert: true,
  cache: true,
  analytics: true
});

// Your routes work unchanged
fastify.get('/api/users', async () => {
  return {
    users: [
      { id: 1, name: 'Alice', role: 'admin' },
      { id: 2, name: 'Bob', role: 'user' }
    ]
  };
});

await fastify.listen({ port: 3000 });
```

### 2. Test with an LLM client

```bash
curl http://localhost:3000/api/users \
  -H "User-Agent: OpenAI/1.0" \
  -H "Accept: text/plain"
```

**Response (TOON format):**
```
users[2]{id,name,role}:
  1,Alice,admin
  2,Bob,user
```

**Headers:**
```
X-TOON-Mode: toon
X-TOON-Savings: 41%
X-TOON-Tokens: 22->13
X-TOON-Cost-Saved: $0.0018
```

## Configuration Options

```javascript
await fastify.register(toonPlugin, {
  // Enable/disable automatic conversion
  autoConvert: true,

  // LLM detection confidence threshold (0-1)
  confidenceThreshold: 0.8,

  // Response conversion confidence threshold (0-1)
  responseConfidenceThreshold: 0.8,

  // Enable caching
  cache: true,
  cacheOptions: {
    maxSize: 100,
    ttl: 60000 // 1 minute
  },

  // Enable analytics
  analytics: true,
  analyticsOptions: {
    enabled: true
  },

  // Custom logger (optional)
  logger: customLogger,

  // Token pricing for cost calculation
  pricing: {
    per1K: 0.002 // $0.002 per 1K tokens
  }
});
```

## Analytics

Track conversion metrics by accessing the decorated analytics instance:

```javascript
import Fastify from 'fastify';
import toonPlugin from '@toon-middleware/fastify';

const fastify = Fastify();

await fastify.register(toonPlugin, {
  analytics: true
});

// Access analytics via decorated property
fastify.toonAnalytics.on('conversion', (payload) => {
  console.log('TOON Conversion:', {
    path: payload.path,
    savings: payload.savings.percentage,
    tokensSaved: payload.savings.tokens,
    costSaved: payload.savings.cost
  });
});

fastify.toonAnalytics.on('error', (error) => {
  console.error('Analytics error:', error);
});

fastify.get('/api/data', async () => {
  return { items: [1, 2, 3] };
});

await fastify.listen({ port: 3000 });
```

## Response Headers

Every response includes metadata headers:

| Header | Description | Example |
|--------|-------------|---------|
| `X-TOON-Mode` | Conversion mode | `toon`, `passthrough`, `fallback` |
| `X-TOON-Savings` | Token savings percentage | `41%` |
| `X-TOON-Tokens` | Token count (before->after) | `22->13` |
| `X-TOON-Cost-Saved` | Estimated cost savings | `$0.0018` |
| `X-Request-ID` | Unique request identifier | Fastify request ID |

## How It Works

1. **Client Detection**: Identifies LLM clients via User-Agent and headers (onRequest hook)
2. **Automatic Conversion**: Converts JSON responses to TOON format for LLM clients (onSend hook)
3. **Caching**: Caches converted responses for improved performance
4. **Analytics**: Tracks token savings and conversion metrics
5. **Fallback**: Gracefully falls back to JSON on conversion errors

## Fastify Hooks Used

- `onRequest` - Detects client type and attaches client info
- `onSend` - Intercepts response and converts to TOON if needed
- `onResponse` - Logs request completion

## Use Cases

### LLM API Responses
Perfect for APIs serving LLM applications:
- Chat completion endpoints
- Retrieval augmented generation (RAG)
- AI agent tools and function calling
- Streaming responses

### Cost Optimization
Reduce LLM API costs by 30-70%:
- OpenAI GPT models
- Anthropic Claude
- Google Gemini
- Any token-based LLM API

## Examples

### Basic Plugin Registration

```javascript
import Fastify from 'fastify';
import toonPlugin from '@toon-middleware/fastify';

const fastify = Fastify({ logger: true });

await fastify.register(toonPlugin);

fastify.get('/api/health', async () => {
  return { status: 'ok', timestamp: Date.now() };
});

await fastify.listen({ port: 3000 });
```

### With Custom Configuration

```javascript
import Fastify from 'fastify';
import toonPlugin from '@toon-middleware/fastify';
import { logger } from '@toon-middleware/logger';

const fastify = Fastify();

await fastify.register(toonPlugin, {
  autoConvert: true,
  confidenceThreshold: 0.9,
  cache: true,
  cacheOptions: {
    maxSize: 1000,
    ttl: 300000
  },
  analytics: true,
  logger: logger,
  pricing: {
    per1K: 0.005
  }
});

fastify.get('/api/data', async () => {
  return { items: [{ id: 1 }, { id: 2 }] };
});

await fastify.listen({ port: 3000 });
```

### With Analytics Tracking

```javascript
import Fastify from 'fastify';
import toonPlugin from '@toon-middleware/fastify';

const fastify = Fastify();

await fastify.register(toonPlugin, {
  analytics: true
});

// Track conversions
fastify.toonAnalytics.on('conversion', (data) => {
  console.log(`Saved ${data.savings.tokens} tokens (${data.savings.percentage}%)`);
  console.log(`Cost savings: $${data.savings.cost.toFixed(4)}`);
});

fastify.get('/api/users', async () => {
  return {
    users: [
      { id: 1, name: 'Alice', email: 'alice@example.com' },
      { id: 2, name: 'Bob', email: 'bob@example.com' }
    ]
  };
});

await fastify.listen({ port: 3000 });
```

### Accessing Cache

```javascript
import Fastify from 'fastify';
import toonPlugin from '@toon-middleware/fastify';

const fastify = Fastify();

await fastify.register(toonPlugin, {
  cache: true
});

// Access cache via decorated property
if (fastify.toonCache) {
  console.log('Cache is enabled');
}

fastify.get('/api/test', async () => {
  return { message: 'test' };
});

await fastify.listen({ port: 3000 });
```

## License

MIT

## Links

- [GitHub Repository](https://github.com/toon-format/toon-middleware)
- [TOON Format Specification](https://github.com/toon-format/toon)
- [Documentation](https://github.com/toon-format/toon-middleware#readme)
