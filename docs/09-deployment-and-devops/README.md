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
  - Triggers Render redeploy via `RENDER_DEPLOY_HOOK`

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
3. **CD** calls the **Render Deploy Hook** (`RENDER_DEPLOY_HOOK` GitHub secret) so Render pulls and runs the new image.

Tags published to GHCR:

- `latest` — most recent production build (what Render should use)
- `<commit-sha>` — immutable tag for rollbacks

### How Render gets the latest code

```text
merge → CI passes → CD builds image → push :latest to GHCR → POST deploy hook → Render redeploys
```

**Recommended Render setup:** Web Service from **Existing Image**  
`ghcr.io/<owner>/payonce:latest` + Deploy Hook URL stored as GitHub secret `RENDER_DEPLOY_HOOK`.

Detailed walkthrough (settings, verification, rollback):  
[notes/render/how-latest-code-is-deployed.md](../../notes/render/how-latest-code-is-deployed.md)

**Do not** pin Render to an old SHA tag if you want automatic updates — use `:latest` and let CD + the hook refresh the service.

## Production deploy (free tier): Render split stack

Use three free services (no credit card on Render, Neon, or Upstash):

| Service | Role |
|---------|------|
| [Neon](https://neon.tech) | Postgres (`DATABASE_URL`) |
| [Upstash](https://upstash.com) | Redis (`REDIS_URL`) |
| [Render](https://render.com) | API (GHCR image + deploy hook, or Dockerfile build) |

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
SIGNUP_ENABLED=true
SESSION_COOKIE_NAME=payonce_session
SESSION_TTL_HOURS=168
IDEMPOTENCY_TTL_SECONDS=86400
CORS_ORIGINS=https://your-app.onrender.com
NODE_ENV=production
```

6. **Create Web Service** — see [GHCR + Deploy Hook](#optional-ghcr-image--deploy-hook-recommended) below for automatic deploys after CI.

### Optional: GHCR image + Deploy Hook (recommended)

This matches `.github/workflows/deploy.yml` — Render runs the same image CI/CD built:

1. **+ New** → **Web Service** → **Existing Image**
2. **Image URL:** `ghcr.io/<owner>/payonce:latest` (lowercase; use `:latest`, not a fixed SHA)
3. Same environment variables as above
4. Render → **Settings** → **Deploy Hook** → copy URL
5. GitHub repo → **Settings → Secrets and variables → Actions** → add `RENDER_DEPLOY_HOOK`
6. Merge to `main` — after CI passes, CD pushes `:latest` and POSTs the hook; Render redeploys

Full details: [notes/render/how-latest-code-is-deployed.md](../../notes/render/how-latest-code-is-deployed.md)

### 4. Verify production

```bash
curl https://your-app.onrender.com/health
curl https://your-app.onrender.com/ready
```

After a merge to `main`, confirm **GitHub Actions → CD** succeeded, then check **Render → Events** for a deploy triggered by the hook.

## Notes

- Local Postgres is exposed on host port **5433** to avoid conflicts with existing local Postgres on 5432.
- CI uses the default Postgres service port 5432 on GitHub Actions runners.
- Render free tier **spins down after ~15 min idle** — first request after sleep may take 30–50+ seconds.
- Render sets `PORT` automatically (e.g. `10000`); the app reads `PORT` from env.
- `fly.toml` is not used — Render does not depend on Fly.io.
- How Render picks up new builds: [notes/render/how-latest-code-is-deployed.md](../../notes/render/how-latest-code-is-deployed.md)

## How to verify

```bash
docker compose ps
curl http://localhost:3000/ready
```
