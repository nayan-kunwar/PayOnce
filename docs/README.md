# PayOnce Production Documentation

This folder documents the production-ready upgrade of PayOnce from an in-memory LLD demo to a durable, secure payment API.

## Phases

| Phase | Topic | Folder |
|-------|-------|--------|
| 1 | TypeScript foundation | [01-typescript-foundation](./01-typescript-foundation/README.md) |
| 2 | PostgreSQL persistence | [02-postgresql-persistence](./02-postgresql-persistence/README.md) |
| 3 | Redis idempotency cache | [03-redis-idempotency-cache](./03-redis-idempotency-cache/README.md) |
| 4 | Validation and idempotency rules | [04-validation-and-idempotency-rules](./04-validation-and-idempotency-rules/README.md) |
| 5 | Security and API hardening | [05-security-and-api-hardening](./05-security-and-api-hardening/README.md) |
| 6 | Observability and health | [06-observability-and-health](./06-observability-and-health/README.md) |
| 7 | Payment lifecycle | [07-payment-lifecycle](./07-payment-lifecycle/README.md) |
| 8 | Testing | [08-testing](./08-testing/README.md) |
| 9 | Deployment and DevOps | [09-deployment-and-devops](./09-deployment-and-devops/README.md) |
| 10 | Demo UI and server-side proxy | [10-demo-ui-and-proxy](./10-demo-ui-and-proxy/README.md) |
| 11 | API key signup | [11-api-key-signup](./11-api-key-signup/README.md) |
| 12 | Accounts, dashboard, and analytics | [12-accounts-dashboard-and-analytics](./12-accounts-dashboard-and-analytics/README.md) |

## Quick start (production stack)

```bash
cp .env.example .env
docker compose up -d postgres redis
bun run migrate
bun run dev
```

See the root [README](../README.md) for API usage.
