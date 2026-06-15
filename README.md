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

### Docker (full stack)

```bash
docker compose up --build
```

---

## API

All `/api/v1/*` routes require an API key:

```
Authorization: Bearer dev-api-key
```

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

---

## Testing

```bash
docker compose up -d postgres redis
bun run migrate
bun run test:all
bun run typecheck
```

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

See [.env.example](./.env.example) for all options.

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `API_KEYS` | Comma-separated API keys |
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
