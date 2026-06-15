# Phase 1: TypeScript Foundation

## What changed

- Migrated all application code from `.js` to `.ts` under `src/`.
- Added shared types in `src/types/` (`payment.ts`, `idempotency.ts`, `api.ts`).
- Added centralized environment validation in `src/config/env.ts` using Zod.
- Added structured error classes in `src/errors/AppError.ts`.
- Removed debug `console.log` calls from the old service/repository layer.
- Updated `tsconfig.json` with strict settings and Bun types.
- Added npm scripts: `dev`, `start`, `typecheck`.

## Why

TypeScript gives compile-time safety for repositories, services, and API contracts. Validated environment variables prevent misconfiguration at startup in production.

## Key files

- `src/config/env.ts`
- `src/types/*`
- `src/errors/AppError.ts`
- `index.ts`

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP port |
| `NODE_ENV` | `development` | Runtime mode |
| `DATABASE_URL` | required | PostgreSQL connection string |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection string |
| `API_KEYS` | `dev-api-key` | Comma-separated API keys |
| `IDEMPOTENCY_TTL_SECONDS` | `86400` | Idempotency record TTL |
| `CORS_ORIGINS` | empty | Comma-separated allowed origins |

## How to verify

```bash
bun run typecheck
bun run dev
```
