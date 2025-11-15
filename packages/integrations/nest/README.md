# @toon-middleware/nest

NestJS integration for TOON middleware - Automatic token optimization for LLM API responses.

## Installation

```bash
npm install @toon-middleware/nest
# or
pnpm add @toon-middleware/nest
# or
yarn add @toon-middleware/nest
```

## Quick Start

### 1. Import and configure the module

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { ToonModule } from '@toon-middleware/nest';

@Module({
  imports: [
    ToonModule.forRoot({
      autoConvert: true,
      cache: true,
      analytics: true
    })
  ]
})
export class AppModule {}
```

### 2. Create your controllers

```typescript
// users.controller.ts
import { Controller, Get } from '@nestjs/common';

@Controller('api')
export class UsersController {
  @Get('users')
  getUsers() {
    return [
      { id: 1, name: 'Alice', role: 'admin' },
      { id: 2, name: 'Bob', role: 'user' }
    ];
  }
}
```

### 3. Test with an LLM client

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

### Synchronous Configuration

```typescript
ToonModule.forRoot({
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
  },

  // Make module global (optional)
  global: true
})
```

### Asynchronous Configuration

For dynamic configuration using `ConfigService`:

```typescript
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ToonModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        autoConvert: configService.get('TOON_AUTO_CONVERT', true),
        cache: configService.get('TOON_CACHE_ENABLED', true),
        analytics: configService.get('TOON_ANALYTICS_ENABLED', true),
        pricing: {
          per1K: configService.get('TOON_PRICING_PER_1K', 0.002)
        }
      })
    })
  ]
})
export class AppModule {}
```

## Analytics

Track conversion metrics by listening to analytics events:

```typescript
import { Injectable, OnModuleInit, Inject } from '@nestjs/common';

@Injectable()
export class AnalyticsService implements OnModuleInit {
  constructor(
    @Inject('TOON_ANALYTICS') private analytics: AnalyticsTracker
  ) {}

  onModuleInit() {
    if (this.analytics) {
      this.analytics.on('conversion', (payload) => {
        console.log('TOON Conversion:', {
          path: payload.path,
          savings: payload.savings.percentage,
          tokensSaved: payload.savings.tokens,
          costSaved: payload.savings.cost
        });
      });

      this.analytics.on('error', (payload) => {
        console.error('TOON Error:', payload.error.message);
      });
    }
  }
}
```

## Response Headers

Every response includes metadata headers:

| Header | Description | Example |
|--------|-------------|---------|
| `X-TOON-Mode` | Conversion mode | `toon`, `passthrough`, `fallback` |
| `X-TOON-Savings` | Token savings percentage | `41%` |
| `X-TOON-Tokens` | Token count (before->after) | `22->13` |
| `X-TOON-Cost-Saved` | Estimated cost savings | `$0.0018` |
| `X-Request-ID` | Unique request identifier | `uuid` |

## How It Works

1. **Client Detection**: Identifies LLM clients via User-Agent and headers
2. **Automatic Conversion**: Converts JSON responses to TOON format for LLM clients
3. **Caching**: Caches converted responses for improved performance
4. **Analytics**: Tracks token savings and conversion metrics
5. **Fallback**: Gracefully falls back to JSON on conversion errors

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

## License

MIT

## Links

- [GitHub Repository](https://github.com/toon-format/toon-middleware)
- [TOON Format Specification](https://github.com/toon-format/toon)
- [Documentation](https://github.com/toon-format/toon-middleware#readme)
