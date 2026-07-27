# CI/CD Operator Guide

Sunluk Commerce uses **GitHub Actions** for PR/push checks and **Dokploy** for deployment on a single VPS.

## Architecture

```
GitHub push/PR  →  GitHub Actions CI  →  checks pass
         ↓
push to main  →  Dokploy (connected to GitHub repo)
         ↓
Dokploy clones repo → docker compose build → Medusa migrations → restart services
         ↓
Traefik routes traffic to storefront / backend containers
```

Dokploy owns: deployment orchestration, Traefik routing, domains, TLS, runtime environment variables, and service restarts.

CI owns: lint, build, and test checks on every PR and push.

Runtime secrets live in Dokploy, never in GitHub Actions.

## Prerequisites

- A VPS (Ubuntu 22.04+ recommended) with Docker installed.
- A domain name pointed at the VPS IP.
- A GitHub account with access to the Sunluk Commerce repository.

## Install Dokploy on the VPS

```bash
curl -sSL https://dokploy.com/install.sh | sh
```

Open `http://<vps-ip>:3000` and create an admin account.

## Connect GitHub

1. In Dokploy, go to **Settings → Git Providers**.
2. Add a **GitHub** provider. Follow the OAuth flow or paste a Personal Access Token (PAT) with `repo` scope.
3. Verify the provider shows your repository.

## Create the Dokploy Application

1. Create a **Project** (e.g. `sunluk-commerce`).
2. In the project, click **Create Service → Docker Compose**.
3. Under **Source**, select the GitHub provider and your repository.
4. Set the **branch** to `main`.
5. Set the **Compose Path** to `docker-compose.prod.yml`.

## Environment Variables

Set these in the Dokploy application's **Environment** tab. Dokploy injects them into the compose stack as container environment variables and for compose interpolation.

### Required

| Variable | Used by | Description |
|---|---|---|
| `POSTGRES_PASSWORD` | postgres, backend | PostgreSQL password. Set a strong random value. |
| `POSTGRES_DB` | postgres, backend | Database name. Default: `medusa`. |
| `POSTGRES_USER` | postgres, backend | Database user. Default: `medusa`. |
| `JWT_SECRET` | backend | Medusa JWT secret. Generate with `openssl rand -base64 32`. |
| `COOKIE_SECRET` | backend | Medusa cookie secret. Generate with `openssl rand -base64 32`. |
| `STORE_CORS` | backend | Comma-separated allowed storefront origins for production. |
| `ADMIN_CORS` | backend | Comma-separated allowed admin origins for production. |
| `AUTH_CORS` | backend | Comma-separated allowed auth origins for production. |
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | storefront | Public backend URL (e.g. `https://api.yourdomain.com`). |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | storefront | Medusa publishable API key from admin dashboard. |

### Optional (add later if needed)

| Variable | When |
|---|---|
| `REDIS_URL` | If Medusa requires Redis for caching/events/workflows. Update `docker-compose.prod.yml` to add a Redis service first. |
| S3/MinIO keys | If using file storage for product images. |

**Important:** No application secrets go into GitHub. Production environment variables live only in Dokploy.

## Domains and Routing

Dokploy uses Traefik to route traffic. In the application's **Domains** tab:

1. Add a domain for the **storefront** pointing to port `3000`.
2. Add a domain for the **backend** (API) pointing to port `9000`.
3. Enable **HTTPS** (Let's Encrypt) for each domain.

Dokploy generates Traefik labels automatically. You do not need to add labels to the compose file.

Current v0 storefront routing:

- `sunluk.ru` is the canonical storefront host.
- `www.sunluk.ru` returns a permanent HTTP 308 to canonical `https://sunluk.ru`, preserving path and query.
- `sunluk.com` and `www.sunluk.com` return a temporary HTTP 307 to `https://sunluk.ru`, preserving path and query.
- The redirect is intentionally temporary because `.com` will become a separate EU storefront later.
- Until the storefront is deployed, `https://sunluk.ru` terminates TLS and returns Traefik's 418 no-op response.
- The pre-deploy routing lives on the VPS at `/etc/dokploy/traefik/dynamic/sunluk-domains.yml`; the storefront's Dokploy domain must replace the `.ru` no-op router during first deployment.

Dokploy panel access:

- The control panel is available at `https://deploy.sunluk.ru`.
- Direct public access through `http://201.24.118.185:3000` is disabled after HTTPS verification.
- The Traefik route lives at `/etc/dokploy/traefik/dynamic/dokploy-panel-domain.yml`.
- After the initial plaintext setup, change the Dokploy administrator password through the HTTPS panel.

## First Deploy

1. Complete all steps above (Dokploy install, GitHub provider, project, application, environment variables, domains).
2. Click **Deploy** in the Dokploy application, or push a commit to `main`.
3. Dokploy will:
   - Clone the repository.
   - Build Docker images for backend and storefront.
   - Start PostgreSQL, backend, and storefront via `docker compose`.
   - Medusa runs migrations automatically on backend startup.
4. Check the **Deployments** tab for build logs and status.
5. Visit your domains to verify the storefront and API are live.

## CI Checks (GitHub Actions)

Every pull request and push to `main` runs:

1. `npm ci` for storefront and backend.
2. Storefront lint and build.
3. Backend lint, tests (if test files exist), and build.

A failing check blocks PR merge. CI does not deploy — Dokploy handles that.

## Rollback

Automatic rollback is out of scope for v0. If a deployment fails:

1. **Inspect:** Go to the Dokploy **Deployments** tab and check the latest deployment logs.
2. **Redeploy a previous commit:** In Dokploy, find a previous successful deployment and click **Redeploy**. Or manually trigger a deploy from the **Deployments** tab.
3. **If migration broke state:** Fix the database mismatch before redeploying. The backend will not start if migrations fail.

## Persistence Warning

**Do not delete the `postgres_data` Docker volume.** This volume holds all production data (products, orders, customers, configuration). Deleting it permanently destroys the database.

```bash
# NEVER run this on the VPS:
docker volume rm sunluk-commerce_postgres_data  # ← destructive
```

Dokploy preserves named volumes across deployments by default. Verify this is the case after your first deploy:

```bash
docker volume ls | grep postgres_data
```

Recommendation: set up regular PostgreSQL backups (out of scope for v0, but important for production).

## Redis

Redis is **not included** in the v0 production stack. If a Medusa feature requires Redis later:

1. Add a `redis` service to `docker-compose.prod.yml`.
2. Add `REDIS_URL: redis://redis:6379` to the backend environment.
3. Add a `redis_data` named volume if persistence is needed.
4. Update this document.

## What Is Out of Scope

These are intentionally not part of v0:

- Blue/green or canary deployments
- Multi-server orchestration
- Kubernetes
- Automatic database backups
- Automatic Sentry release upload
- Registry-based image builds (images are built on the VPS by Dokploy)
- SSH-based deploy workflows
