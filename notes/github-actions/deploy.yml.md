# deploy.yml

**Path in repo:** `.github/workflows/deploy.yml`  
**Tech:** GitHub Actions + Docker + GHCR + Render Deploy Hook

## What it is

GitHub Actions **CD** (continuous deployment) workflow. It runs only after the CI workflow succeeds on `main` or `master`.

## Role in this project

Publishes a production Docker image to GHCR and tells **Render** to redeploy the latest image.

## Flow

```text
push/merge to main
       ↓
CI (ci.yml) — tests pass
       ↓
CD (deploy.yml)
  • checkout passing commit SHA
  • docker build + push ghcr.io/<owner>/<repo>:latest
  • docker push  ghcr.io/<owner>/<repo>:<commit-sha>
  • curl -X POST $RENDER_DEPLOY_HOOK
       ↓
Render pulls :latest and redeploys
```

Full Render setup and troubleshooting: [notes/render/how-latest-code-is-deployed.md](../render/how-latest-code-is-deployed.md)

## Jobs

### `publish`

1. **Trigger** — `workflow_run` when the `CI` workflow completes successfully on `main`/`master`
2. **Checkout** — the exact commit SHA that passed CI (`head_sha`)
3. **Login** — GitHub Container Registry (`ghcr.io`) using `GITHUB_TOKEN`
4. **Build & push** — Docker image from the repo `Dockerfile`
5. **Trigger Render deploy** — POST to `secrets.RENDER_DEPLOY_HOOK`

## Image tags

| Tag | Meaning |
|-----|---------|
| `latest` | Most recent successful deploy from `main`/`master` — **point Render here** |
| `<commit-sha>` | Immutable tag for a specific passing build (rollback) |

Image location: `ghcr.io/<owner>/<repo>` (e.g. `ghcr.io/nayan-kunwar/payonce`)

## GitHub secret required

| Secret | Source |
|--------|--------|
| `RENDER_DEPLOY_HOOK` | Render Dashboard → Web Service → Settings → Deploy Hook |

Without this secret, CD still pushes to GHCR but Render will **not** auto-redeploy.

## Render service settings

- **Deploy type:** Existing Image (recommended)
- **Image:** `ghcr.io/<owner>/payonce:latest`
- Do **not** pin a old SHA tag if you want every green `main` build to go live

## First-time setup (GitHub)

1. Push to `main`/`master` and confirm both **CI** and **CD** workflows succeed in the Actions tab.
2. Add `RENDER_DEPLOY_HOOK` in repo secrets.
3. Open **Packages** on the repo and set container visibility if needed (public for open source, private otherwise).

## CI vs CD

| Workflow | When | Purpose |
|----------|------|---------|
| `ci.yml` | Every PR + push to main | Test and typecheck |
| `deploy.yml` | After CI passes on main | Build image, push GHCR, trigger Render |

See also: [ci.yml.md](./ci.yml.md)

## Notes

_Add your own notes below — registry setup, rollback, etc._
