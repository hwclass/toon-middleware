<div align="center">

# 🎯 TOON Middleware

**The missing middleware for LLM-powered applications**

Slash 30-70% off your API costs instantly with zero contract changes.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node Version](https://img.shields.io/badge/node-%3E%3D24-brightgreen.svg)](https://nodejs.org)
[![PNPM](https://img.shields.io/badge/pnpm-9+-orange.svg)](https://pnpm.io)

[Features](#-features) • [Quick Start](#-quick-start) • [Usage](#-usage) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 🌟 Features

- **⚡ Zero-Config Integration** - Add one line to your Express app, start saving immediately
- **💰 Instant Cost Savings** - 30-70% reduction in token usage for LLM API responses
- **🔍 Smart Detection** - Automatically identifies LLM clients vs. regular browsers
- **📊 Built-in Analytics** - Real-time savings tracking and metrics
- **🚀 High Performance** - <3ms middleware overhead, >2000 req/s throughput
- **🧩 Pluggable Architecture** - Swap cache, logger, or add custom detectors
- **🏗️ Functional Core** - Pure, deterministic, side-effect-free business logic
- **📦 Framework Ready** - Express today, NestJS & Fastify coming soon

---

## 📖 What is TOON?

[TOON (Token-Oriented Object Notation)](https://github.com/toon-format/toon) is a compact serialization format designed for LLMs. It achieves 30-60% fewer tokens than JSON by:

- Using indentation instead of braces
- Declaring field names once for arrays
- Removing redundant punctuation
- Maintaining human readability

**Example:**

```javascript
// Standard JSON (86 characters ≈ 22 tokens)
{"users":[{"id":1,"name":"Alice","role":"admin"},{"id":2,"name":"Bob","role":"user"}]}

// TOON format (52 characters ≈ 13 tokens - 41% savings!)
users[2]{id,name,role}:
  1,Alice,admin
  2,Bob,user
```

---

## 🚀 Quick Start

### Installation

```bash
npm install @toon-middleware/express
# or
pnpm add @toon-middleware/express
# or
yarn add @toon-middleware/express
```

### Basic Usage

```javascript
import express from 'express';
import { createExpressToonMiddleware } from '@toon-middleware/express';

const app = express();

// Add TOON middleware (that's it!)
app.use(createExpressToonMiddleware());

// Your existing routes work unchanged
app.get('/api/users', (req, res) => {
  res.json({
    users: [
      { id: 1, name: 'Alice', email: 'alice@example.com' },
      { id: 2, name: 'Bob', email: 'bob@example.com' }
    ]
  });
});

app.listen(3000);
```

**That's it!** LLM clients now automatically receive TOON responses, while browsers get JSON.

---

## 💡 Usage

### Express Integration

#### Basic Setup

```javascript
import express from 'express';
import { createExpressToonMiddleware } from '@toon-middleware/express';

const app = express();

app.use(express.json());
app.use(createExpressToonMiddleware());

// 🤖 LLM Inference Endpoint - Benefits from TOON compression
app.post('/api/chat/completions', (req, res) => {
  // Simulate chat completion response (large, repetitive structure)
  res.json({
    id: 'chatcmpl-123',
    object: 'chat.completion',
    created: Date.now(),
    model: 'gpt-4',
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: 'Here are the analysis results...'
        },
        finish_reason: 'stop'
      }
    ],
    usage: {
      prompt_tokens: 50,
      completion_tokens: 200,
      total_tokens: 250
    }
  });
});

// 📊 Analytics Endpoint - Perfect for TOON (uniform array data)
app.get('/api/users', (req, res) => {
  res.json({
    users: [
      { id: 1, name: 'Alice', email: 'alice@example.com', role: 'admin', active: true },
      { id: 2, name: 'Bob', email: 'bob@example.com', role: 'user', active: true },
      { id: 3, name: 'Carol', email: 'carol@example.com', role: 'user', active: false }
    ],
    total: 3,
    page: 1
  });
});

// 🌐 Regular Endpoint - Browsers get JSON, LLMs get TOON automatically
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.listen(3000);
```

**What happens:**

- 🤖 **LLM clients** (detected by User-Agent or headers) → Get TOON format, save 30-70% tokens
- 🌐 **Browser clients** → Get regular JSON, everything works as expected
- **No code changes needed** - The middleware handles everything automatically!

**Example Response Comparison:**

When an LLM client requests `/api/users`, they receive:
```
users[3]{active,email,id,name,role}:
  true,alice@example.com,1,Alice,admin
  true,bob@example.com,2,Bob,user
  false,carol@example.com,3,Carol,user
total: 3
page: 1
```

When a browser requests the same endpoint, they receive:
```json
{
  "users": [
    {"id": 1, "name": "Alice", "email": "alice@example.com", "role": "admin", "active": true},
    {"id": 2, "name": "Bob", "email": "bob@example.com", "role": "user", "active": true},
    {"id": 3, "name": "Carol", "email": "carol@example.com", "role": "user", "active": false}
  ],
  "total": 3,
  "page": 1
}
```

Same data, different format, automatic detection! 🎯

#### Advanced Configuration

```javascript
import { createExpressToonMiddleware } from '@toon-middleware/express';

app.use(createExpressToonMiddleware({
  // Auto-convert responses for detected LLM clients (default: true)
  autoConvert: true,

  // Enable caching (default: true)
  cache: true,
  cacheOptions: {
    maxSize: 1000,        // Max cached entries
    ttl: 300000,          // 5 minutes
    checkPeriod: 60000    // Cleanup every minute
  },

  // Enable analytics tracking (default: true)
  analytics: true,

  // LLM detection confidence threshold (0-1, default: 0.8)
  confidenceThreshold: 0.8,

  // Token pricing for savings calculation
  pricing: {
    per1K: 0.002  // $0.002 per 1K tokens (default)
  },

  // Custom logger (default: built-in logger)
  logger: customLogger,

  // Log level: 'error' | 'warn' | 'info' | 'debug' | 'trace'
  logLevel: 'info'
}));
```

#### Response Headers

TOON middleware adds helpful headers to responses:

```http
X-TOON-Mode: toon                    # 'toon', 'passthrough', or 'fallback'
X-TOON-Savings: 42.5%                # Percentage of tokens saved
X-TOON-Tokens: 240->138              # Original -> Converted token count
X-TOON-Cost-Saved: $0.0002           # Estimated cost savings
X-Request-ID: req-1699564823456-abc  # Unique request identifier
```

#### Listening to Analytics Events

```javascript
import { createExpressToonMiddleware } from '@toon-middleware/express';

const middleware = createExpressToonMiddleware({
  analytics: true
});

// Access the analytics tracker
middleware.analytics?.on('conversion', (data) => {
  console.log('Conversion:', data);
  // {
  //   requestId: 'req-123',
  //   path: '/api/users',
  //   method: 'GET',
  //   savings: { percentage: 42.5, tokens: 102, cost: 0.0002 },
  //   timestamp: '2024-11-13T10:30:00.000Z'
  // }
});

middleware.analytics?.on('error', (error) => {
  console.error('Analytics error:', error);
});

app.use(middleware);
```

#### Custom Client Detection

```javascript
import { createExpressToonMiddleware } from '@toon-middleware/express';
import { createHeaderDetector } from '@toon-middleware/core';

app.use(createExpressToonMiddleware({
  customDetectors: [
    // Detect custom header
    createHeaderDetector('x-my-llm-client', () => true, {
      confidence: 1.0
    }),

    // Custom detection function
    ({ headers, userAgent }) => {
      if (headers['x-api-key']?.startsWith('llm-')) {
        return { isLLM: true, confidence: 0.95 };
      }
      return { isRegular: true, confidence: 0.5 };
    }
  ]
}));
```

#### Disable Auto-Conversion (Manual Mode)

```javascript
import { createExpressToonMiddleware } from '@toon-middleware/express';
import { convertToTOON } from '@toon-middleware/core';

app.use(createExpressToonMiddleware({
  autoConvert: false  // Disable automatic conversion
}));

app.get('/api/data', (req, res) => {
  const data = { users: [...] };

  // Manually convert to TOON
  const result = convertToTOON(data);

  if (result.success) {
    res.set('Content-Type', 'text/plain; charset=utf-8');
    res.send(result.data);
  } else {
    res.json(data);  // Fallback to JSON
  }
});
```

### Client Usage

#### Making Requests

LLM clients should include headers to request TOON format:

```javascript
// Using fetch
const response = await fetch('http://localhost:3000/api/users', {
  headers: {
    'User-Agent': 'OpenAI-API-Client/1.0',
    'Accept': 'application/json, text/toon',
    'X-Accept-Toon': 'true'
  }
});

const toonData = await response.text();
console.log(toonData);  // TOON formatted response
```

#### Sending TOON Data

```javascript
import { convertToTOON } from '@toon-middleware/core';

const data = { users: [...] };
const result = convertToTOON(data);

const response = await fetch('http://localhost:3000/api/ingest', {
  method: 'POST',
  headers: {
    'Content-Type': 'text/plain; charset=utf-8',
    'X-Accept-Toon': 'true'
  },
  body: result.data
});
```

---

## 🏗️ Architecture

### Monorepo Structure

```
toon-middleware/
├── packages/
│   ├── core/                  # Pure business logic (converters, detectors, analytics)
│   ├── integrations/          # Framework-specific adapters
│   │   ├── express/           # Express middleware ✅
│   │   ├── nest/              # NestJS module (planned)
│   │   └── fastify/           # Fastify plugin (planned)
│   ├── plugins/               # Pluggable infrastructure
│   │   ├── cache/             # Cache manager implementation
│   │   └── logger/            # Logger factory and transports
│   ├── utils/                 # Shared helpers
│   └── examples/              # Example applications
│       └── express-basic/     # Express demo with dashboard
└── tools/                     # Benchmarks, scripts, configs
```

### Packages

**Core:**
- `@toon-middleware/core` — TOON converters, client detectors, analytics, optimizers, validators
- `@toon-middleware/utils` — Shared helpers for request IDs, validation, header detection

**Integrations:**
- `@toon-middleware/express` — Express middleware (available now)
- `@toon-middleware/nest` — NestJS module (coming soon)
- `@toon-middleware/fastify` — Fastify plugin (coming soon)

**Plugins:**
- `@toon-middleware/cache` — Event-driven TTL cache with LRU eviction
- `@toon-middleware/logger` — Level-aware structured logger

---

## 🧪 Development

### Prerequisites

- **Node.js 24+** (LTS) - Use [nvm](https://github.com/nvm-sh/nvm) for version management
- **PNPM 9+** - Fast, disk space efficient package manager

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/toon-middleware.git
cd toon-middleware

# Use the correct Node version (if you have nvm installed)
nvm use

# Install dependencies
pnpm install

# Run tests
pnpm test

# Run benchmarks
pnpm benchmark

# Start the demo server
pnpm demo
```

Visit `http://localhost:5050/dashboard` to see live savings metrics.

### Available Scripts

```bash
pnpm build          # Build all packages
pnpm test           # Run all tests (node:test)
pnpm test:coverage  # Generate experimental coverage
pnpm test:watch     # Run tests in watch mode
pnpm benchmark      # Execute performance benchmarks
pnpm lint           # Lint all packages
pnpm typecheck      # Type check JS with TypeScript
pnpm dev            # Start demo in development mode
pnpm demo           # Start demo server
pnpm clean          # Clean all build artifacts and node_modules
```

### Project Principles

- **Functional Core, Imperative Shell** - Pure business logic in `core`, side effects in `integrations` and `plugins`
- **Workspace Discipline** - Internal packages use workspace protocol (`workspace:*`)
- **Test Coverage** - Every pure function has tests for determinism and immutability
- **Performance First** - Benchmarks validate <3ms overhead and >2000 req/s throughput
- **Documentation** - Every feature includes examples and API documentation

---

## 📊 Performance Benchmarks

Targets:
- ✅ Core conversions: **<1 ms average**
- ✅ Middleware overhead: **<3 ms**
- ✅ Throughput: **>2000 requests/second**

Run benchmarks:

```bash
pnpm benchmark
```

---

## 🗺️ Roadmap

- [x] Express middleware integration
- [x] Intelligent LLM client detection
- [x] In-memory caching with TTL
- [x] Real-time analytics and savings tracking
- [x] Performance benchmarks
- [ ] NestJS module
- [ ] Fastify plugin
- [ ] Redis cache adapter
- [ ] OpenTelemetry integration
- [ ] Metrics exporters (Prometheus, Datadog)
- [ ] Distributed load testing harness

---

## 📚 Documentation

- [Architecture Guide](docs/architecture.md) - Functional core, imperative shell pattern
- [API Reference](docs/api-reference.md) - Complete API documentation
- [Examples](docs/examples/) - Usage examples and patterns

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork and clone** the repository
2. **Use the correct Node version**: `nvm use` (requires Node 24+)
3. **Install dependencies**: `pnpm install`
4. **Create a feature branch**: `git checkout -b feature/amazing-feature`
5. **Make your changes** following our architecture principles:
   - Keep business logic pure in `packages/core`
   - Isolate side effects in `integrations` and `plugins`
   - Add tests for new functionality
6. **Run tests and linting**: `pnpm test && pnpm lint`
7. **Commit your changes**: `git commit -m 'Add amazing feature'`
8. **Push to your fork**: `git push origin feature/amazing-feature`
9. **Open a Pull Request**

### Development Guidelines

- Keep business logic pure and deterministic inside `packages/core`
- Isolate side effects (HTTP, caching, logging, timers) within `integrations` and `plugins`
- Reuse shared helpers from `packages/utils` to avoid duplication
- Maintain documentation alongside features (`docs/` and package READMEs)
- Enforce workspace consistency via shared linting, formatting, and type checking

---

## 📄 License

TOON Middleware is released under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

- [TOON Format](https://github.com/toon-format/toon) - The compact serialization format powering this middleware
- The Node.js and Express communities for building amazing tools

---

<div align="center">

**Built with ❤️ for the LLM ecosystem**

[⭐ Star us on GitHub](https://github.com/yourusername/toon-middleware) • [🐛 Report a Bug](https://github.com/yourusername/toon-middleware/issues) • [💡 Request a Feature](https://github.com/yourusername/toon-middleware/issues)

</div>
