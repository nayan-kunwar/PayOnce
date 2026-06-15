# Phase 6: Observability and Health

## What changed

- Added structured HTTP logging with `pino` + `pino-http` in `src/app.ts`.
- Added `GET /health` — liveness probe (always 200 if process is up).
- Added `GET /ready` — readiness probe (checks Postgres `SELECT 1` and Redis `PING`).
- Added graceful shutdown in `index.ts` on `SIGTERM` / `SIGINT`:
  - Close HTTP server
  - Quit Redis
  - End Postgres pool

## Why

Production deployments (Kubernetes, Docker Compose, load balancers) need liveness vs readiness separation. Structured logs support debugging and log aggregation. Graceful shutdown prevents dropped in-flight requests during deploys.

## How to verify

```bash
curl http://localhost:3000/health
curl http://localhost:3000/ready

# Stop Postgres and retry /ready — expect 503
docker compose stop postgres
curl http://localhost:3000/ready
```
