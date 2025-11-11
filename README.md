# TOON Middleware

The missing middleware for LLM-powered applications. Add one line, slash 30-70% off API costs instantly. TOON Middleware slots into your HTTP framework with zero contract changes, delivering TOON-formatted responses, deterministic analytics, and built-in observability from day one. Express support ships today, with NestJS, Fastify, and additional runtimes on the roadmap.

## Highlights
- Functional core built with pure, side-effect free TypeScript-ready modules
- Shell adapters (Express today, additional frameworks tomorrow) that handle TOON negotiation, caching, logging, and analytics
- Workspace powered by PNPM with zero dependency duplication
- Benchmark suite targeting <3 ms middleware overhead and >2000 req/s throughput
- Demo application showcasing live token savings and integration patterns

## Monorepo Layout
```
toon-middleware/
├── package.json               # Root scripts and shared tooling
├── pnpm-workspace.yaml        # Workspace configuration
├── packages/
│   ├── core/                  # Pure business logic (converters, detectors, analytics)
│   ├── shell-express/         # Express middleware shell (currently available)
│   ├── shell-nest/            # NestJS module (planned)
│   ├── shell-fastify/         # Fastify plugin (planned)
│   ├── shell-cache/           # Cache manager implementation
│   ├── shell-logger/          # Logger factory and transports
│   ├── utils/                 # Shared constants and helpers
│   └── demo/                  # Demo server, client, and dashboard
├── tools/                     # Benchmarks, scripts, configs
└── docs/                      # Architecture, API reference, examples
```

### Workspace Packages
- `@toon-middleware/core` — TOON converters, client detectors, savings analytics, optimizers, validators
- `@toon-middleware/shell-express` — Express middleware, error boundaries, analytics adapter (shipping)
- `@toon-middleware/shell-nest` — NestJS integration module (planned)
- `@toon-middleware/shell-fastify` — Fastify plugin (planned)
- `@toon-middleware/shell-cache` — Event-driven TTL cache with pluggable storage strategies
- `@toon-middleware/shell-logger` — Level aware logger factory with structured output
- `@toon-middleware/utils` — Shared helpers for request IDs, validation, and header detection
- `@toon-middleware/demo` — Sample application and dashboard demonstrating savings in real time
- `@toon-middleware/benchmarks` — Performance benchmark runner

## Getting Started
1. Install prerequisites
   - Node.js 24+
   - PNPM 9+
2. Clone and install dependencies
   ```bash
   pnpm install
   ```
3. Run the Express demo server
   ```bash
   pnpm demo
   ```
4. Visit `http://localhost:5050/dashboard` and inspect the TOON response headers and savings metrics.

## Core Concepts
- **Functional Core**: Pure functions implement TOON conversion, optimization, validation, and analytics logic. They are deterministic, side-effect free, and fully unit tested.
- **Imperative Shell**: Framework-specific adapters (Express today, others tomorrow) coordinate IO, logging, caching, analytics, and error handling while delegating all business logic to the core.
- **Workspace Discipline**: Internal packages use the workspace protocol, keeping dependencies deduplicated and versions aligned.

## Available Scripts
```bash
pnpm build          # Build all packages
pnpm test           # Run all tests (node:test)
pnpm test:coverage  # Generate experimental coverage
pnpm benchmark      # Execute performance benchmarks
pnpm lint           # Lint all packages
pnpm typecheck      # Type check JS with TypeScript compiler
pnpm dev            # Start the demo in watch mode
```

## Testing
- Core tests focus on purity, determinism, and immutability.
- Current shell integration tests exercise the Express adapter across request/response flow, header negotiation, and error paths; forthcoming adapters will follow the same approach.
- Utilities, cache, and logger packages include focused unit tests.

## Performance Benchmarks
Run the benchmark suite to validate latency and throughput objectives:
```bash
pnpm benchmark
```
Targets:
- Core conversions <1 ms average
- Middleware overhead <3 ms
- Throughput >2000 requests per second

## Demo Walkthrough
1. Start the Express demo server: `pnpm demo`
2. Run the sample client: `pnpm --filter demo start -- --client`
3. Observe response headers (`x-toon-savings`, `x-toon-tokens`, `x-toon-cost-saved`) and dashboard metrics.

## Roadmap
- **Shell adapters:** NestJS module, Fastify plugin, and lightweight Fetch-first middleware
- **Caching:** Redis and edge KV storage adapters
- **Observability:** OpenTelemetry traces and structured metrics exporters
- **Benchmarks:** Distributed load harness spanning multiple frameworks

## Development Guidelines
- Keep business logic pure and deterministic inside `packages/core`.
- Isolate side effects (HTTP, caching, logging, timers) within shell packages.
- Reuse shared helpers from `packages/utils` to avoid duplication.
- Maintain documentation alongside features (`docs/` and package level READMEs).
- Enforce workspace consistency via shared linting, formatting, and type checking tools.

## Contributing
1. Fork and clone the repository.
2. Install dependencies with `pnpm install`.
3. Follow functional core and imperative shell separation principles.
4. Add or update tests, run `pnpm test` and `pnpm lint`.
5. Document new features in `docs/` and package READMEs.

## License
TOON Middleware is released under the MIT License. See [LICENSE](LICENSE) for details.

