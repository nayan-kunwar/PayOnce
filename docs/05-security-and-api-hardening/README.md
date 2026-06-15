# Phase 5: Security and API Hardening

## What changed

- Added `apiKeyAuth` middleware — accepts `Authorization: Bearer <key>` or `X-API-Key`.
- API keys configured via comma-separated `API_KEYS` env var.
- Added `express-rate-limit`:
  - Global: 300 requests / 15 min
  - `POST /payments`: 60 requests / 15 min
- Added `helmet` for security headers.
- Added configurable `cors` — deny-by-default in production unless `CORS_ORIGINS` is set.

## Why

Payment APIs must not be publicly writable. Rate limiting reduces abuse; helmet and CORS reduce common web attack surface.

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
