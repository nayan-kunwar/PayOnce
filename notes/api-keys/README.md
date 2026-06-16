# API keys

**Config:** `API_KEYS` env var in `.env` / Render / Fly secrets  
**Code:** `src/middleware/apiKeyAuth.ts`, `src/config/env.ts`

## What they are

Shared secrets that clients must send to use the **payment API**. Think of them as passwords for `/api/v1/*` routes.

Without a valid key, requests get **401 Unauthorized**.

## What they protect

| Route | API key required? |
|-------|-------------------|
| `GET /` | No |
| `GET /health` | No |
| `GET /ready` | No |
| `POST /api/v1/payments` | **Yes** |
| `GET /api/v1/payments` | **Yes** |
| `GET /api/v1/payments/:id` | **Yes** |
| `PATCH /api/v1/payments/:id/status` | **Yes** |

Health routes stay public so Render/Fly can probe `/ready` without a key.

## How clients send the key

Either header works:

```
Authorization: Bearer your-api-key
```

or

```
X-API-Key: your-api-key
```

## Configuration

`API_KEYS` is a **comma-separated** list in env:

```env
API_KEYS=dev-api-key,another-dev-key
```

Parsed in `src/config/env.ts` — split by comma, trimmed, empty values removed.

| Environment | Example |
|-------------|---------|
| Local | `dev-api-key` (`.env.example`) |
| CI | `test-api-key` (`.github/workflows/ci.yml`) |
| Production (Render) | Strong random secret — **not** `dev-api-key` |

## Example requests

```bash
# List payments — works with valid key
curl -H "Authorization: Bearer your-api-key" \
  https://payonce-uppq.onrender.com/api/v1/payments

# Missing key — 401
curl https://payonce-uppq.onrender.com/api/v1/payments

# Create payment
curl -X POST https://payonce-uppq.onrender.com/api/v1/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -H "Idempotency-Key: unique-key-123" \
  -d '{"amount": 1000, "customerId": "cust_123"}'
```

## Why it matters in production

The API is on a **public URL**. API keys stop strangers from:

- Creating fake payments
- Reading payment data
- Updating payment status

This is **shared-secret auth** — simple, not user login. Good for server-to-server or trusted clients (your app, Postman, scripts).

## Multiple keys

Use several keys for different clients:

```env
API_KEYS=mobile-app-key,admin-key,partner-key
```

Rotate or revoke one key without breaking others.

## Flow (middleware)

```
Request → extract key from Authorization or X-API-Key
       → compare against env.API_KEYS[]
       → match? continue to route handler
       → no match? 401 UnauthorizedError
```

Applied on all routes in `src/routes/PaymentRoutes.ts` via `router.use(apiKeyAuth)`.

## Notes

_Add your own notes below — key rotation, Render env setup, generating secrets, etc._
