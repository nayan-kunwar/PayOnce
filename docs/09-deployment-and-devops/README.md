# Phase 9: Deployment and DevOps

## What changed

- Added `docker-compose.yml` with `postgres`, `redis`, and `app` services.
- Added multi-stage `Dockerfile` (Bun runtime, runs migrate + start).
- Added `.env.example` with all required variables.
- Added GitHub Actions CI at `.github/workflows/ci.yml`:
  - Typecheck
  - Migrate
  - Unit and integration tests with Postgres + Redis service containers

## Local Docker stack

```bash
cp .env.example .env
docker compose up -d postgres redis
bun run migrate
bun run dev
```

## Full stack via Docker

```bash
docker compose up --build
```

The app container runs migrations then starts on port 3000.

## Notes

- Local Postgres is exposed on host port **5433** to avoid conflicts with existing local Postgres on 5432.
- CI uses the default Postgres service port 5432 on GitHub Actions runners.

## How to verify

```bash
docker compose ps
curl http://localhost:3000/ready
```
