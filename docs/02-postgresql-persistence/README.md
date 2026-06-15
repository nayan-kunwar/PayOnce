# Phase 2: PostgreSQL Persistence

## What changed

- Added Drizzle ORM schema in `src/db/schema.ts` for `payments` and `idempotency_records`.
- Added SQL migration at `drizzle/migrations/0000_init.sql`.
- Added migration runner at `scripts/migrate.ts`.
- Implemented `PostgresPaymentRepository` and `PostgresIdempotencyRepository`.
- Added transactional create in `src/db/transactions/createPaymentTransaction.ts`.
- Added `GET /api/v1/payments/:id`.
- Removed in-memory `MemoryDB` from the production path (kept `src/db/MemoryDB.ts` for optional test use).

## Why

In-memory storage loses data on restart and cannot enforce uniqueness under concurrency. PostgreSQL provides ACID transactions and a unique constraint on `(customer_id, idempotency_key)` to prevent duplicate payments when requests race.

## Schema

```sql
payments (id, customer_id, amount, status, created_at, updated_at)
idempotency_records (customer_id, idempotency_key, request_hash, payment_id, response_json, expires_at)
UNIQUE (customer_id, idempotency_key)
```

## How to verify

```bash
docker compose up -d postgres
bun run migrate
curl -H "Authorization: Bearer dev-api-key" \
     -H "Idempotency-Key: pg-test-1" \
     -H "Content-Type: application/json" \
     -d '{"amount":1000,"customerId":"cust_1"}' \
     http://localhost:3000/api/v1/payments
```

Restart the server and repeat the same request — the payment should still exist in Postgres.
