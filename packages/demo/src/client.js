import http from 'node:http';

const options = {
  hostname: 'localhost',
  port: process.env.DEMO_PORT || 5050,
  path: '/api/llm-response',
  method: 'GET',
  headers: {
    'User-Agent': 'OpenAI-API-Client/1.0',
    Accept: 'application/json, text/toon',
    'X-Accept-Toon': 'true'
  }
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response Headers:', res.headers);
    console.log('TOON Payload:', data.slice(0, 200), '...');
  });
});

req.on('error', error => {
  console.error('Demo client error:', error);
});

req.end();

