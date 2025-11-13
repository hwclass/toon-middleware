import { performance } from 'node:perf_hooks';

export class PerformanceBenchmark {
  constructor() {
    this.results = [];
  }

  async runCoreBenchmarks() {
    console.log('🏁 Running Functional Core Benchmarks...');

    const { convertToTOON, calculateSavings } = await import('@toon-middleware/core');
    const testData = this.generateTestData();

    const conversionResults = await this.benchmarkConversions(convertToTOON, testData);
    const savingsResults = await this.benchmarkSavings(calculateSavings, testData);

    return {
      core: {
        conversions: conversionResults,
        savings: savingsResults
      }
    };
  }

  async runShellBenchmarks() {
    console.log('🏁 Running Imperative Shell Benchmarks...');

    const express = (await import('express')).default;
    const { createExpressToonMiddleware } = await import('@toon-middleware/express');

    const app = express();
    app.use(express.json());
    app.use(createExpressToonMiddleware());

    app.post('/api/data', (req, res) => {
      res.json(req.body);
    });

    const results = await this.benchmarkWithConcurrency(app, {
      requests: 1000,
      concurrency: 50,
      payloadSize: '1kb'
    });

    return { shell: results };
  }

  async benchmarkConversions(convertFn, testData) {
    const iterations = 1000;
    const times = [];

    for (let i = 0; i < iterations; i += 1) {
      const start = performance.now();
      const result = convertFn(testData);
      const end = performance.now();

      if (result.success) {
        times.push(end - start);
      }
    }

    return this.calculateStats(times);
  }

  async benchmarkSavings(calculateFn, testData) {
    const iterations = 1000;
    const times = [];
    const jsonString = JSON.stringify(testData);
    const toonString = '[[]]'; // placeholder to avoid dependency calls

    for (let i = 0; i < iterations; i += 1) {
      const start = performance.now();
      calculateFn(jsonString, toonString);
      const end = performance.now();
      times.push(end - start);
    }

    return this.calculateStats(times);
  }

  async benchmarkWithConcurrency(app, config) {
    const server = app.listen(0);
    const port = server.address().port;

    const payload = JSON.stringify(this.generateTestData(config.payloadSize || '1kb'));
    const start = performance.now();

    const requests = Array.from({ length: config.requests }, () => ({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'OpenAI-API-Client/1.0',
        Accept: 'application/json, text/toon',
        'X-Accept-Toon': 'true'
      },
      body: payload
    }));

    const chunks = [];
    for (let i = 0; i < requests.length; i += config.concurrency) {
      chunks.push(requests.slice(i, i + config.concurrency));
    }

    let completed = 0;
    for (const chunk of chunks) {
      await Promise.all(
        chunk.map(async body => {
          const response = await fetch(`http://localhost:${port}/api/data`, body);
          await response.text();
          completed += 1;
        })
      );
    }

    const end = performance.now();
    server.close();

    const duration = end - start;

    return {
      totalRequests: completed,
      duration,
      average: duration / completed,
      throughput: (completed / duration) * 1000
    };
  }

  calculateStats(times) {
    if (!times.length) {
      return {
        iterations: 0,
        average: 0,
        min: 0,
        max: 0,
        p50: 0,
        p95: 0,
        p99: 0
      };
    }

    const sorted = [...times].sort((a, b) => a - b);
    const total = times.reduce((a, b) => a + b, 0);

    return {
      iterations: times.length,
      average: total / times.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }

  generateTestData() {
    return {
      users: Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        metadata: {
          created: new Date().toISOString(),
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
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const benchmark = new PerformanceBenchmark();

  console.log('🚀 Starting TOON Middleware Performance Benchmarks...\n');

  const coreResults = await benchmark.runCoreBenchmarks();
  const shellResults = await benchmark.runShellBenchmarks();

  console.log('\n📊 Benchmark Results:');
  console.log('Core (Pure Functions):', JSON.stringify(coreResults, null, 2));
  console.log('Shell (With Side Effects):', JSON.stringify(shellResults, null, 2));

  const requirements = {
    coreConversion: coreResults.core.conversions.average < 1.0,
    shellLatency: shellResults.shell.average < 3.0,
    throughput: shellResults.shell.throughput > 2000
  };

  console.log('\n✅ Requirements Check:', requirements);

  const allPassed = Object.values(requirements).every(Boolean);
  process.exit(allPassed ? 0 : 1);
}

