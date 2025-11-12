import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createExpressToonMiddleware } from '@toon-middleware/express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json());
app.use(createExpressToonMiddleware());

app.get('/api/llm-response', (req, res) => {
  const payload = buildDemoPayload();
  res.json(payload);
});

app.use('/dashboard', express.static(path.join(__dirname, 'dashboard')));
app.use('/', express.static(path.join(__dirname, '..', 'public')));

const port = Number(process.env.DEMO_PORT || 5050);

app.listen(port, () => {
  console.log(`TOON middleware demo running on http://localhost:${port}`);
  startTrafficSimulator(port);
});

function buildDemoPayload() {
  const model = pick(MODELS);
  const promptTokens = randomInt(500, 6000);
  const completionTokens = randomInt(120, 2000);
  const temperature = Number((Math.random() * 0.8 + 0.1).toFixed(2));
  const numChoices = randomInt(1, 3);

  const choices = Array.from({ length: numChoices }, (_, index) => ({
    index,
    finish_reason: pick(FINISH_REASONS),
    message: {
      role: 'assistant',
      content: generateParagraph(randomInt(40, 220))
    },
    logprobs: null,
    usage: {
      completionTokens: Math.floor(completionTokens / numChoices),
      totalTokens: Math.floor(promptTokens / numChoices) + Math.floor(completionTokens / numChoices)
    }
  }));

  return {
    id: `chatcmpl-${randomString(9)}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model,
    system_fingerprint: `fp_${randomString(10)}`,
    usage: {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens
    },
    choices,
    metadata: {
      latencyMs: Number((Math.random() * 200 + 50).toFixed(2)),
      temperature,
      topP: Number((Math.random() * 0.3 + 0.7).toFixed(2)),
      toolCalls: randomInt(0, 2)
    }
  };
}

function startTrafficSimulator(port) {
  if ((process.env.TOON_SIMULATOR || '').toLowerCase() === 'off') {
    console.log('TOON simulator disabled (TOON_SIMULATOR=off)');
    return;
  }

  const intervalMs = Math.max(Number(process.env.TOON_SIMULATOR_INTERVAL || 3500), 1000);

  const sendSyntheticRequest = async () => {
    try {
      const response = await fetch(
        `http://localhost:${port}/api/llm-response?sim=${Date.now()}`,
        {
          headers: {
            'User-Agent': 'OpenAI-API-Client/Sim',
            Accept: 'application/json, text/toon',
            'X-Accept-Toon': 'true'
          }
        }
      );

      // Drain body to completion so the connection can be reused.
      await response.text();
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.warn('[simulator] request failed:', error.message);
      }
    }
  };

  sendSyntheticRequest().catch(() => {});

  const timer = setInterval(() => {
    sendSyntheticRequest().catch(() => {});
  }, intervalMs);

  timer.unref?.();
  console.log(`TOON simulator sending synthetic LLM traffic every ${intervalMs}ms`);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(list) {
  return list[randomInt(0, list.length - 1)];
}

function randomString(length) {
  return Array.from({ length }, () => pick(STRING_ALPHABET)).join('');
}

function generateParagraph(wordCount) {
  return Array.from({ length: wordCount }, () => pick(LOREM)).join(' ');
}

const MODELS = [
  'gpt-4o',
  'gpt-4.1-mini',
  'gpt-4-turbo',
  'claude-3-5-sonnet',
  'claude-3-haiku',
  'mistral-large',
  'groq-llama3-70b'
];

const FINISH_REASONS = ['stop', 'length', 'tool_calls', 'content_filter'];

const STRING_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

const LOREM = [
  'adaptive',
  'alignment',
  'bandwidth',
  'benchmark',
  'cache',
  'capability',
  'compute',
  'context',
  'decoder',
  'embedding',
  'latency',
  'middleware',
  'observer',
  'optimization',
  'pipeline',
  'quantization',
  'throughput',
  'token',
  'transformer',
  'vector'
];
