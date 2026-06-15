# Phase 5: Security and API Hardening

## What changed

- Added `apiKeyAuth` middleware — accepts `Authorization: Bearer <key>` or `X-API-Key`.
- API keys configured via comma-separated `API_KEYS` env var.
- Added `express-rate-limit`:
  - Global: 300 requests / 15 min
  - `POST /payments`: 60 requests / 15 min
- Added `helmet` for security headers.
- Added configurable `cors` — deny-by-default in production unless `CORS_ORIGINS` is set.
- Added **`/demo/api/*`** server-side proxy for the public test UI — no API key in the browser (see [Phase 10](../10-demo-ui-and-proxy/README.md)).

## Why

Payment APIs must not be publicly writable via **`/api/v1`**. The demo proxy exposes a separate, rate-limited path for the `/demo` UI while keeping real keys in env.

## How to verify

```bash
# Missing API key — 401
curl -X POST http://localhost:3000/api/v1/payments \
  -H "Idempotency-Key: test" \
  -H "Content-Type: application/json" \
  -d '{"amount":100,"customerId":"c1"}'

# Valid API key — 201
curl -X POST http://localhost:3000/api/v1/payments \
  -H "Authorization: Bearer dev-api-key" \
  -H "Idempotency-Key: test" \
  -H "Content-Type: application/json" \
  -d '{"amount":100,"customerId":"c1"}'
```
