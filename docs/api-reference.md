# API Reference

## `@toon-middleware/core`

### Converters

- `convertToTOON(data, options?)` → `{ success, data, error, compressionRatio }`
- `convertFromTOON(toonString, options?)` → `{ success, data, error }`

### Detectors

- `detectClient(requestData, options?)` → `{ type, confidence, matchedPatterns }`
- `createUserAgentDetector(patterns, options?)` → detector function
- `createHeaderDetector(headerName, predicate, options?)` → detector function

### Analytics

- `calculateSavings(jsonString, toonString, pricing?)` → savings report
- `estimateTokens(text, options?)` → token estimate number

### Optimisers

- `optimizeForTOON(data, options?)` → optimised copy
- `optimizeArray(array, options?)`
- `optimizeObject(object, options?)`

### Validators

- `validateTOONOutput(toonString)` → `{ valid, error? }`
- `validateDecodedData(data)` → `{ valid, error? }`
- `isValidTOONString(value)` → boolean

### Constants

- `ClientType` → `{ LLM, REGULAR }`
- `SavingsInfo` → default savings structure
- `ConversionResult` → default conversion result shape

## `@toon-middleware/shell-express`

- `createExpressToonMiddleware(options?)` → Express middleware function
- `TOONMiddlewareError` → custom error class
- `errorHandler(error, req, res, next)` → Express error handler
- `AnalyticsTracker` → Emits conversion and error events

### Middleware Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `autoConvert` | boolean | `true` | Enable outbound response conversion |
| `cache` | boolean | `true` | Enable response caching |
| `analytics` | boolean | `true` | Emit analytics events |
| `logLevel` | string | `'info'` | Logger verbosity |
| `confidenceThreshold` | number | `0.8` | LLM detection threshold |
| `pricing.per1K` | number | `0.002` | Token cost per 1000 tokens |

## `@toon-middleware/shell-cache`

- `CacheManager` → Event-driven TTL cache with stats and eviction

## `@toon-middleware/shell-logger`

- `createLogger(level?, transport?)`
- `logger` → default shared logger instance

## `@toon-middleware/utils`

- `HEADER_NAMES`, `DEFAULT_CONFIG`, `REQUEST_ID_PREFIX`
- Helpers: `generateRequestId`, `measureDuration`, `toBigIntTime`, `safeJsonStringify`
- Validators: `isLLMConfidenceHigh`, `isConvertiblePayload`, `wantsToonResponse`, `isToonContentType`

## Demo Package

- `@toon-middleware/demo` → Starts an Express demo server with dashboard and sample client

Refer to the respective package READMEs and tests for further usage examples.

