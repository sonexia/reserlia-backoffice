import path from 'node:path';
import dotenv from 'dotenv';
// Load .env.local first (if present), then fall back to .env
const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envLocal = dotenv.config({ path: envLocalPath, override: true });
const envDefault = dotenv.config({ override: true });
// Debug: show which env files were parsed and if STRIPE vars are present
// Note: These logs are only for local debugging
console.log('[dev-lambda] dotenv .env.local parsed:', !!envLocal.parsed, envLocalPath);
console.log('[dev-lambda] dotenv .env parsed:', !!envDefault.parsed);
const key = process.env.STRIPE_SECRET_KEY || '';
const masked = key ? `${key.slice(0, 6)}… (${key.length} chars)` : 'MISSING';
console.log('[dev-lambda] STRIPE_SECRET_KEY present:', Boolean(key), '| value:', masked);

if (!key) {
  console.error('[dev-lambda] ERROR: STRIPE_SECRET_KEY is not loaded. Ensure .env.local exists at:', envLocalPath);
  console.error('[dev-lambda] TIP: Restart this process after editing .env.local (Ctrl+C then npm run dev:lambda).');
}
import express from 'express';
import cors from 'cors';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
// Important: dynamically import the handler AFTER env is loaded
const { handler } = await import('../amplify/functions/createCheckout/handler');

const app = express();
const port = Number(process.env.DEV_LAMBDA_PORT || 8787);

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json());

// Small helper to build an API Gateway v2-like event
function buildEvent(req: express.Request, rawPath: string): APIGatewayProxyEventV2 {
  const headers: Record<string, string> = {};
  for (const [k, v] of Object.entries(req.headers)) {
    if (typeof v === 'string') headers[k] = v;
    else if (Array.isArray(v)) headers[k] = v.join(',');
  }
  const query: Record<string, string> = {};
  for (const [k, v] of Object.entries(req.query)) {
    if (typeof v === 'string') query[k] = v;
  }
  const method = req.method;
  const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {});
  const requestContext = {
    accountId: '000000000000',
    apiId: 'local',
    domainName: 'localhost',
    domainPrefix: 'localhost',
    http: { method, path: rawPath, protocol: 'HTTP/1.1', sourceIp: req.ip, userAgent: headers['user-agent'] || '' },
    requestId: 'local',
    routeKey: `${method} ${rawPath}`,
    stage: 'local',
    time: new Date().toISOString(),
    timeEpoch: Date.now(),
  } as APIGatewayProxyEventV2['requestContext'];

  return {
    version: '2.0',
    routeKey: `${method} ${rawPath}`,
    rawPath,
    rawQueryString: new URLSearchParams(query).toString(),
    headers,
    queryStringParameters: Object.keys(query).length ? query : undefined,
    requestContext,
    isBase64Encoded: false,
    body,
  };
}

app.options('/createCheckout/*', (_req, res) => {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  }).status(204).send();
});

app.post('/createCheckout/create', async (req, res) => {
  const event = buildEvent(req, '/createCheckout/create');
  const result = await handler(event);
  res.status(result.statusCode || 200).set(result.headers || {}).send(result.body || '');
});

app.post('/createCheckout/portal', async (req, res) => {
  const event = buildEvent(req, '/createCheckout/portal');
  const result = await handler(event);
  res.status(result.statusCode || 200).set(result.headers || {}).send(result.body || '');
});

app.get('/createCheckout/confirm', async (req, res) => {
  const event = buildEvent(req, '/createCheckout/confirm');
  const result = await handler(event);
  res.status(result.statusCode || 200).set(result.headers || {}).send(result.body || '');
});

app.listen(port, () => {
  console.log(`[dev-lambda] listening on http://localhost:${port}`);
});
