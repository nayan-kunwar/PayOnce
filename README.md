# PayOnce

PayOnce is a production-grade mini payment API built with Bun, Express, TypeScript, PostgreSQL, and Redis. It demonstrates layered architecture, customer-scoped idempotency, and durable payment storage.

---

## Features

- **Customer-scoped idempotency** — `(customerId, Idempotency-Key)` prevents duplicate charges on retry
- **PostgreSQL + Redis** — durable storage with fast idempotency cache
- **Request fingerprinting** — `409 Conflict` when the same key is reused with a different body
- **API key authentication**, rate limiting, validation, structured logging
- **Health/readiness probes** and graceful shutdown
- **Payment lifecycle** — status transitions with validation

Full implementation notes: [docs/README.md](./docs/README.md)

---

## Production Setup

### Prerequisites

- [Bun](https://bun.sh)
- [Docker](https://www.docker.com/) (for Postgres and Redis)

### 1. Configure environment

```bash
cp .env.example .env
```

### 2. Start infrastructure

```bash
docker compose up -d postgres redis
bun run migrate
```

### 3. Run the server

```bash
bun run dev
```

Server runs at `http://localhost:3000`.

Interactive API reference: **`/docs`** (OpenAPI 3.1 + Scalar — search, code samples, Try It).

### Docker (full stack)

```bash
docker compose up --build
```

### Deploy to production (free tier)

Render + Neon + Upstash — step-by-step guide: [docs/09-deployment-and-devops](./docs/09-deployment-and-devops/README.md#production-deploy-free-tier-render-split-stack).

**How Render gets the latest code after you merge to `main`:** CI passes → CD pushes `ghcr.io/<owner>/payonce:latest` → Render Deploy Hook redeploys. Details: [notes/render/how-latest-code-is-deployed.md](./notes/render/how-latest-code-is-deployed.md).

---

## API

All `/api/v1/*` routes require an API key:

```
Authorization: Bearer dev-api-key
```

Create an account at **`/login`**, then generate personal API keys from the **`/dashboard`**.

### User account and dashboard

Use `GET /login` to create an account and log in. The app sets an HttpOnly session cookie.

After login, open `GET /dashboard` to:

- Create/list/revoke personal API keys (`/dashboard/api/keys`)
- View usage analytics (`/dashboard/api/usage/*`)

Auth endpoints:

- `POST /auth/signup`
- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/logout`

### Create payment

`POST /api/v1/payments`

Headers:
- `Content-Type: application/json`
- `Idempotency-Key: <unique-string>` (required)

Body:
```json
{
  "amount": 1000,
  "customerId": "cust_123"
}
```

Response (`201`):
```json
{
  "success": true,
  "fromCache": false,
  "payment": {
    "id": "pay_...",
    "amount": 1000,
    "customerId": "cust_123",
    "status": "pending",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

Retry with the same key returns `"fromCache": true` and the same payment.

### List payments

`GET /api/v1/payments`

### Get payment by ID

`GET /api/v1/payments/:id`

### Update payment status

`PATCH /api/v1/payments/:id/status`

Body:
```json
{ "status": "completed" }
```

Allowed from `pending`: `completed`, `failed`, `cancelled`.

### Health

- `GET /health` — liveness
- `GET /ready` — readiness (Postgres + Redis)

### Test UI

Open **`/demo`** in the browser for a built-in test console (create/list payments, update status, health checks). **No API key required** — the UI calls `/demo/api/*` on the server; real keys stay in `API_KEYS` env.

Programmatic access still uses **`/api/v1/*`** with `Authorization: Bearer <key>`.

Details: [docs/10-demo-ui-and-proxy](./docs/10-demo-ui-and-proxy/README.md).

---

## Testing

Integration tests **truncate all tables** and flush Redis. They always use **local Docker** (`localhost:5433`), even if your `.env` points at Neon/Upstash — see `tests/setup.ts`.

```bash
docker compose up -d postgres redis
bun run migrate
bun run test:all
bun run typecheck
```

Or one command: `bun run test:integration:local`

---

## Project Structure

```text
src/
├── app.ts
├── config/env.ts
├── controllers/
├── db/
├── errors/
├── middleware/
├── repositories/
├── routes/
├── services/
├── types/
├── utils/
└── validators/
docs/           # Per-phase production upgrade documentation
tests/
drizzle/
```

---

## Environment Variables

Full guide: [notes/env/README.md](./notes/env/README.md) (files, profiles, Render checklist).

See [.env.example](./.env.example) for a local Docker template and [.env.production.example](./.env.production.example) for Render (placeholders only).

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `API_KEYS` | Comma-separated API keys (server-only; not exposed to `/demo`) |
| `DEMO_ENABLED` | Enable public demo API at `/demo/api` (default `true`; set `false` to disable) |
| `SESSION_COOKIE_NAME` | Cookie name for user session auth (default `payonce_session`) |
| `SESSION_TTL_HOURS` | Session lifetime in hours (default 168) |
| `IDEMPOTENCY_TTL_SECONDS` | Idempotency TTL (default 86400) |
| `CORS_ORIGINS` | Allowed CORS origins |

---

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start with watch mode |
| `bun run start` | Start server |
| `bun run migrate` | Run database migrations |
| `bun run typecheck` | TypeScript check |
| `bun run test:all` | Run all tests |
