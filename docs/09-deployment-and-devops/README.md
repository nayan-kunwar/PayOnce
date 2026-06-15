# Phase 9: Deployment and DevOps

## What changed

- Added `docker-compose.yml` with `postgres`, `redis`, and `app` services.
- Added multi-stage `Dockerfile` (Bun runtime, runs migrate + start).
- Added `.env.example` with all required variables.
- Added GitHub Actions CI at `.github/workflows/ci.yml`:
  - Typecheck
  - Migrate
  - Unit and integration tests with Postgres + Redis service containers
- Added GitHub Actions CD at `.github/workflows/deploy.yml`:
  - Runs after CI succeeds on `main`/`master`
  - Builds and pushes the app image to GitHub Container Registry (`ghcr.io`)

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

## Continuous deployment (CD)

On every successful merge to `main`/`master`:

1. **CI** runs tests (see `.github/workflows/ci.yml`).
2. **CD** builds the Docker image and pushes it to `ghcr.io/<owner>/<repo>` (see `.github/workflows/deploy.yml`).

Tags published:

- `latest` — most recent production build
- `<commit-sha>` — immutable tag for rollbacks

### Run the published image

```bash
docker pull ghcr.io/<owner>/<repo>:latest

docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/payonce \
  -e REDIS_URL=redis://host:6379 \
  -e API_KEYS=your-production-api-key \
  -e IDEMPOTENCY_TTL_SECONDS=86400 \
  ghcr.io/<owner>/<repo>:latest
```

The container runs migrations on startup, then starts the API on port 3000.

### First-time GitHub setup

1. Merge to `main` and confirm **CI** then **CD** succeed under the Actions tab.
2. In **Packages**, set container visibility (public for open source repos, private otherwise).

## Notes

- Local Postgres is exposed on host port **5433** to avoid conflicts with existing local Postgres on 5432.
- CI uses the default Postgres service port 5432 on GitHub Actions runners.
- CD publishes the app image only; you still provision Postgres and Redis (managed DB, VPS, or `docker compose` on a host).

## How to verify

```bash
docker compose ps
curl http://localhost:3000/ready
```
