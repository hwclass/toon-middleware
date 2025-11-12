# Basic Usage

Install dependencies and add the middleware to an Express application.

```bash
pnpm install
pnpm --filter shell-express build
```

```javascript
import express from 'express';
import { createExpressToonMiddleware } from '@toon-middleware/express';

const app = express();
app.use(express.json());
app.use(createExpressToonMiddleware());

app.post('/chat', async (req, res) => {
  const response = await callLLM(req.body);
  res.json(response);
});

app.listen(3000, () => console.log('Server ready'));
```

Any LLM client that requests TOON responses (`Accept: text/toon`) now receives compressed payloads with token savings metrics.

