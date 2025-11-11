import express from 'express';
import { createExpressToonMiddleware } from '../src/middleware.js';

const app = express();
app.use(express.json());
app.use(createExpressToonMiddleware());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`TOON middleware demo listening on port ${port}`);
});

