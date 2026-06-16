# How Render deploys the latest code

This project uses **GitHub Actions CD + GHCR + a Render Deploy Hook** so production runs the same commit that passed CI.

## End-to-end flow

```text
You merge to main
       ↓
GitHub Actions: CI (tests + typecheck + migrate)
       ↓  (only if CI succeeds)
GitHub Actions: CD (.github/workflows/deploy.yml)
  1. Checkout the passing commit SHA
  2. docker build → push ghcr.io/<owner>/<repo>:latest
  3. docker push  → ghcr.io/<owner>/<repo>:<commit-sha>
  4. POST Render Deploy Hook (secret RENDER_DEPLOY_HOOK)
       ↓
Render pulls :latest from GHCR and redeploys the web service
       ↓
Live app at https://<your-service>.onrender.com
```

## What each piece does

| Piece | Role |
|-------|------|
| **CI** (`ci.yml`) | Quality gate on every PR and push to `main` |
| **CD** (`deploy.yml`) | Builds and publishes the Docker image after CI passes |
| **GHCR** | Stores `latest` and immutable `<sha>` image tags |
| **Render Deploy Hook** | Tells Render to redeploy and pull the newest image |
| **Render Web Service** | Runs the container with Neon + Upstash env vars |

CD does **not** push source code directly to Render. It publishes an image, then triggers Render to deploy that image.

## Render service settings (recommended)

Use an **Existing Image** service (not “build from GitHub repo” on Render), so production matches the CI-built image:

1. Render Dashboard → your Web Service → **Settings**
2. **Image URL:** `ghcr.io/<github-owner>/payonce:latest`  
   (lowercase repo name; match your GitHub package path)
3. **Auto-Deploy:** can stay off for image services — CD triggers deploys via the hook
4. **Deploy Hook:** copy the hook URL → GitHub repo **Settings → Secrets → Actions** → `RENDER_DEPLOY_HOOK`

### GitHub secret

| Secret | Value |
|--------|--------|
| `RENDER_DEPLOY_HOOK` | Full URL from Render → Settings → Deploy Hook |

The CD workflow runs:

```bash
curl -fsS -X POST "$RENDER_DEPLOY_HOOK"
```

after the image push succeeds.

## Alternative: Render builds from GitHub (no GHCR)

If the Render service is connected to the **GitHub repo** and builds the **Dockerfile** on Render:

- Render deploys on every push to the linked branch (`main`)
- GitHub CD + GHCR is optional
- You may run **two** build paths (Render native + Actions) unless you disable one

For this repo, the intended path is **GHCR + Deploy Hook** (see `.github/workflows/deploy.yml`).

## How to confirm a deploy

1. **GitHub Actions** — `CD` workflow completed after a green `CI` run on `main`
2. **GHCR** — package shows a new `latest` push time / SHA tag
3. **Render** — Dashboard → **Events** shows a deploy triggered by the hook
4. **Live app:**

```bash
curl https://<your-app>.onrender.com/health
curl https://<your-app>.onrender.com/ready
```

## Rollback

GHCR also tags each build with the commit SHA:

```text
ghcr.io/<owner>/payonce:<full-commit-sha>
```

In Render, temporarily change the image tag to a known-good SHA, redeploy, then fix `main` and let CD publish a new `latest`.

## Common issues

| Symptom | Likely cause |
|---------|----------------|
| Render still on old code | Image tag pinned to a SHA instead of `:latest`; or deploy hook missing / failed |
| CD succeeds but Render idle | `RENDER_DEPLOY_HOOK` secret not set or wrong URL |
| 401 pulling GHCR image | Render needs credentials for **private** packages, or make the package public |
| Deploy hook runs but app broken | Check Render logs; run `bun run migrate` is inside Docker **CMD** — ensure Neon URL is set |

## Related docs

- Phase 9: [docs/09-deployment-and-devops/README.md](../../docs/09-deployment-and-devops/README.md)
- CD workflow notes: [notes/github-actions/deploy.yml.md](../github-actions/deploy.yml.md)
