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

Render (production) deploys separately when you connect the GitHub repo — see below.

## Production deploy (free tier): Render split stack

Use three free services (no credit card on Render, Neon, or Upstash):

| Service | Role |
|---------|------|
| [Neon](https://neon.tech) | Postgres (`DATABASE_URL`) |
| [Upstash](https://upstash.com) | Redis (`REDIS_URL`) |
| [Render](https://render.com) | API (builds from GitHub `Dockerfile`) |

### 1. Create Neon database

1. Create a Neon project.
2. Copy the **pooled** connection string (includes `?sslmode=require`).

### 2. Create Upstash Redis

1. Create a Redis database in a region near your Render region (e.g. Oregon).
2. Copy the **Redis URL** (`rediss://...`).

### 3. Create Render web service

1. Render Dashboard → **+ New** → **Web Service**.
2. Connect your **GitHub** repo (`payonce`).
3. Render detects the **Dockerfile** automatically.
4. Settings:
   - **Instance type:** Free
   - **Health Check Path:** `/ready`
5. **Environment variables:**

```env
DATABASE_URL=postgresql://...        # Neon pooled URL
REDIS_URL=rediss://...               # Upstash URL
API_KEYS=your-production-api-key
DEMO_ENABLED=true
IDEMPOTENCY_TTL_SECONDS=86400
CORS_ORIGINS=https://your-app.onrender.com
NODE_ENV=production
```

6. **Create Web Service** — Render builds and deploys on every push to the linked branch.

### 4. Verify production

```bash
curl https://your-app.onrender.com/health
curl https://your-app.onrender.com/ready
```

### Optional: GHCR image instead of GitHub build

If you prefer the CD-published image:

1. **+ New** → **Web Service** → **Existing Image**.
2. Image URL: `ghcr.io/<owner>/<repo>:latest`
3. Same environment variables as above.
4. Trigger redeploys via Render **Deploy Hook** (Settings tab) from GitHub Actions.

## Notes

- Local Postgres is exposed on host port **5433** to avoid conflicts with existing local Postgres on 5432.
- CI uses the default Postgres service port 5432 on GitHub Actions runners.
- Render free tier **spins down after ~15 min idle** — first request after sleep may take 30–50+ seconds.
- Render sets `PORT` automatically (e.g. `10000`); the app reads `PORT` from env.
- `fly.toml` is not used — Render does not depend on Fly.io.

## How to verify

```bash
docker compose ps
curl http://localhost:3000/ready
```
