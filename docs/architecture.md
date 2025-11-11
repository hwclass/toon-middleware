# TOON Middleware Architecture

TOON Middleware embraces a **Functional Core – Imperative Shell** architecture. Pure, deterministic functions live in the core while side-effectful logic is isolated in shell packages.

## Functional Core

- Package: `@toon-middleware/core`
- Responsibilities: data conversion, detection, analytics, optimisation, validation
- Characteristics:
  - Pure functions with deterministic outputs
  - No I/O or side effects
  - Extensive unit and property-style tests
  - Benchmarks verifying sub-millisecond execution

## Imperative Shell

- Packages: `@toon-middleware/shell-express`, `@toon-middleware/shell-cache`, `@toon-middleware/shell-logger`
- Responsibilities: HTTP integration, caching, logging, telemetry
- Characteristics:
  - Explicit handling of side effects
  - Clear boundaries to the functional core
  - Integration tests and observability hooks

## Shared Utilities

- Package: `@toon-middleware/utils`
- Responsibilities: shared constants, helper utilities, validation helpers
- Characteristics:
  - Pure helper utilities reused across core and shells
  - Keeps duplication low while avoiding tight coupling

## Demo and Tooling

- Demo application showcases plug-and-play integration and live token savings
- Benchmark scripts validate performance (<3ms middleware overhead target)
- Documentation keeps architecture, APIs, and examples accessible

This structure ensures clarity, testability, and scalability, making TOON Middleware straightforward to adopt in any Express.js environment.

