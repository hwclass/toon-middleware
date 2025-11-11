import { performance } from 'node:perf_hooks';
import { convertToTOON } from '../src/converters/toon.js';
import { calculateSavings } from '../src/analytics/tokens.js';

const iterations = Number.parseInt(process.env.BENCHMARK_ITERATIONS || '10000', 10);

function generateTestData() {
  return {
    users: Array.from({ length: 100 }, (_, index) => ({
      id: index,
      name: `User ${index}`,
      email: `user${index}@example.com`,
      metadata: {
        created: '2024-01-01T00:00:00.000Z',
        preferences: { theme: 'dark', language: 'en' }
      }
    })),
    pagination: {
      page: 1,
      perPage: 100,
      total: 1000
    }
  };
}

function benchmarkConversion(data) {
  const timings = [];

  for (let i = 0; i < iterations; i += 1) {
    const start = performance.now();
    const result = convertToTOON(data);
    const end = performance.now();

    if (!result.success) {
      throw new Error(result.error || 'Conversion failed');
    }

    timings.push(end - start);
  }

  return calculateStats(timings);
}

function benchmarkSavings(data) {
  const timings = [];
  const jsonString = JSON.stringify(data);
  const conversion = convertToTOON(data);

  if (!conversion.success) {
    throw new Error(conversion.error || 'Conversion failed');
  }

  for (let i = 0; i < iterations; i += 1) {
    const start = performance.now();
    calculateSavings(jsonString, conversion.data);
    const end = performance.now();
    timings.push(end - start);
  }

  return calculateStats(timings);
}

function calculateStats(samples) {
  const sorted = [...samples].sort((a, b) => a - b);
  const total = samples.reduce((acc, value) => acc + value, 0);
  const len = samples.length;

  const pick = percentile => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * percentile))];

  return {
    iterations: len,
    average: total / len,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    p50: pick(0.5),
    p95: pick(0.95),
    p99: pick(0.99)
  };
}

export async function runBenchmark() {
  const dataset = generateTestData();
  const conversions = benchmarkConversion(dataset);
  const savings = benchmarkSavings(dataset);

  return {
    conversions,
    savings
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runBenchmark()
    .then(result => {
      console.log(JSON.stringify(result, null, 2));
      const passes =
        result.conversions.average < 1 &&
        result.savings.average < 0.5;

      process.exit(passes ? 0 : 1);
    })
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

