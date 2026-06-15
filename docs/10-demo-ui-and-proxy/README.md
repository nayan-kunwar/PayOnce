# Phase 10: Demo UI and server-side proxy

## What changed

- Added **`/demo/api/*`** routes — a server-side BFF (backend-for-frontend) for the public test console at `/demo`.
- The browser **never receives or sends** `API_KEYS`; real keys stay in server environment variables only.
- Added **`DEMO_ENABLED`** env flag (default `true`; set `false` to disable demo API routes).
- Added stricter rate limits on demo routes:
  - Global demo: **60 requests / 15 min**
  - Demo `POST /payments`: **20 requests / 15 min**
- In **production**, demo API requests must come from the same site (`Sec-Fetch-Site: same-origin` / `same-site`) so random scripts cannot easily abuse the open demo endpoints.
- Removed the API key input from the `/demo` UI.

## Architecture

```text
Browser (/demo)                Express server
      │                              │
      │  fetch("/demo/api/payments") │
      │ ────────────────────────────►│  demoRoutes (no apiKeyAuth)
      │                              │       │
      │                              │       ▼
      │                              │  paymentController / PaymentService
      │                              │       │
      │◄─────────────────────────────│  JSON response
```

Programmatic clients still use **`/api/v1/*`** with `Authorization: Bearer <key>`.

## Routes

| Method | Demo route | Auth | Notes |
|--------|------------|------|-------|
| `GET` | `/demo/api/payments` | None | List payments (shared demo data) |
| `POST` | `/demo/api/payments` | None | Requires `Idempotency-Key` header |
| `PATCH` | `/demo/api/payments/:id/status` | None | Same validation as `/api/v1` |

When `DEMO_ENABLED=false`, these routes return **404**.

## Environment

```env
# Keep production keys private — never expose in the browser
API_KEYS=your-secret-production-key

# Public demo at /demo (default: enabled)
DEMO_ENABLED=true
```

On Render, set `DEMO_ENABLED=true` if you want the live demo console. Set `false` to hide demo API routes while keeping `/api/v1` protected.

## Security notes

- Demo routes are **intentionally unauthenticated** for visitors — anyone can create/list demo payments.
- Rate limiting and same-origin checks in production reduce casual abuse.
- Do **not** put real customer data in a public demo deployment.
- For private production APIs, disable the demo: `DEMO_ENABLED=false`.

## How to verify

```bash
# Demo route — no API key
curl -X POST http://localhost:3000/demo/api/payments \
  -H "Idempotency-Key: demo-test-1" \
  -H "Content-Type: application/json" \
  -d '{"amount":1000,"customerId":"cust_demo"}'

curl http://localhost:3000/demo/api/payments

# Real API — still requires key
curl http://localhost:3000/api/v1/payments
# → 401 Unauthorized
```

Open **`/demo`** in the browser — create payments without entering a key.
