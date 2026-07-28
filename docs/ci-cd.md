# CI/CD Operator Guide

Sunluk Commerce uses **GitHub Actions** for path-specific PR/push checks and **Dokploy** for independent deployments on a single VPS.

## Architecture

Instead of a monolithic deployment, the storefront and backend are deployed independently to the Timeweb VPS. A storefront commit will not rebuild or restart the backend, and a backend commit will not rebuild or restart the storefront.

```
Storefront:
GitHub push/PR (storefront/**) → Storefront CI Checks → If main and green → Call Storefront Webhook → Dokploy builds & deploys Storefront app

Backend:
GitHub push/PR (backend/**) → Backend CI Checks → If main and green → Call Backend Webhook → Dokploy builds, runs migrations, & deploys Backend app
```

Dokploy owns: deployment orchestration, Traefik routing, domains, TLS, runtime environment variables, and service restarts.

CI owns: lint, test, and build checks on pull requests and pushes to `main` for matching paths.

Runtime secrets live in Dokploy, never in GitHub Actions. GitHub only stores the scoped Dokploy deployment webhooks.

## Prerequisites

- A VPS (Ubuntu 22.04+ recommended) with Docker installed.
- A domain name pointed at the VPS IP.
- A GitHub account with access to the Sunluk Commerce repository.
- Scoped GitHub secrets: `DOKPLOY_STOREFRONT_WEBHOOK` and `DOKPLOY_BACKEND_WEBHOOK`.

## Network Configuration

An external Docker network named `sunluk-production` must be created on the VPS to allow independent containers to communicate:

```bash
docker network create sunluk-production
```

All independent applications (storefront, backend) and the PostgreSQL service must be attached to this network.

## PostgreSQL Configuration

PostgreSQL runs as a long-lived database service named `sunluk-postgres`.
- **Automatic Git deployment must be disabled** to prevent accidental database restarts or recreation.
- It attaches to the `sunluk-production` external network.
- The `postgres_data` Docker volume preserves all database data and must never be deleted.

## Backend Application

- **Context**: Repository root.
- **Dockerfile**: `backend/apps/backend/Dockerfile`.
- **Branch Auto-Deploy**: Enabled via public custom Git source on `main` branch with `autoDeploy: true` (only to expose the refresh-token webhook endpoint, no native provider webhook integration) and `watchPaths` set to `backend/**`.
- **Deploy Trigger**: Triggered solely via `DOKPLOY_BACKEND_WEBHOOK` using a synthetic GitHub push event webhook payload.
- **Network**: Attached to the external `sunluk-production` network.
- **Environment Variables**:
  - `DATABASE_URL`: `postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@sunluk-postgres:5432/${POSTGRES_DB}?sslmode=disable`
  - `MEDUSA_BACKEND_URL`: URL of the backend API (e.g. `https://api.sunluk.ru`).
  - `JWT_SECRET`, `COOKIE_SECRET`, `STORE_CORS`, `ADMIN_CORS`, `AUTH_CORS`.
- **Additive Migrations**: Backend startup command runs migrations before starting: `sh -c "npx medusa db:migrate && npm run start"`. Online backend deployments permit only backward-compatible additive migrations (e.g., adding a table or column). Destructive schema changes (renaming/dropping tables/columns) are forbidden during online rollouts and require a planned maintenance window.

## Storefront Application

- **Context**: `storefront` directory.
- **Dockerfile**: `storefront/Dockerfile`.
- **Branch Auto-Deploy**: Enabled via public custom Git source on `main` branch with `autoDeploy: true` (only to expose the refresh-token webhook endpoint, no native provider webhook integration) and `watchPaths` set to `storefront/**`.
- **Deploy Trigger**: Triggered solely via `DOKPLOY_STOREFRONT_WEBHOOK` using a synthetic GitHub push event webhook payload.
- **Network**: Attached to the external `sunluk-production` network.
- **Required Build Arguments**:
  These public environment variables must be passed as build arguments in Dokploy so Next.js can embed them at build time:
  - `NEXT_PUBLIC_MEDUSA_BACKEND_URL`: The public API endpoint (e.g., `https://api.sunluk.ru`).
  - `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`: The publishable key generated in the Medusa Admin.
  - `NEXT_PUBLIC_SITE_URL`: The public canonical URL of the storefront (e.g., `https://sunluk.ru`).

## Domains and Routing

Dokploy uses Traefik to route traffic. In the application's **Domains** tab:

1. Add a domain for the **storefront** pointing to port `3000`.
2. Add a domain for the **backend** (API) pointing to port `9000`.
3. Enable **HTTPS** (Let's Encrypt) for each domain.

Current v0 storefront routing:

- `sunluk.ru` is the canonical storefront host.
- `www.sunluk.ru` returns a permanent HTTP 308 to canonical `https://sunluk.ru`, preserving path and query.
- `sunluk.com` and `www.sunluk.com` return a temporary HTTP 307 to `https://sunluk.ru`, preserving path and query.
- The redirect is intentionally temporary because `.com` will become a separate EU storefront later.
- Until the storefront is deployed, `https://sunluk.ru` terminates TLS and returns Traefik's 418 no-op response.

## One-Time Cutover Order (Safe Transition)

To transition from the monolithic docker-compose setup to the independent Dokploy applications without data loss or downtime:

1. **Backup PostgreSQL**: Run a manual backup of the database before making any changes.
2. **Create External Network**: Create the `sunluk-production` Docker network on the VPS if not already present.
3. **Attach Database Container**: Attach the existing `sunluk-postgres` container to the `sunluk-production` network.
4. **Create Backend App**: Define the new backend application in Dokploy using `backend/apps/backend/Dockerfile` with `DATABASE_URL` pointed to `sunluk-postgres`.
5. **Create Storefront App**: Define the new storefront application in Dokploy using `storefront/Dockerfile`, providing the required build arguments (`NEXT_PUBLIC_MEDUSA_BACKEND_URL`, `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL`).
6. **Configure Auto-Deploy**: Configure public custom Git source on `main` branch with `autoDeploy: true` (to expose the refresh-token webhook endpoint, no native provider webhook) and set the respective `watchPaths` (`storefront/**` or `backend/**`) to prevent arbitrary rebuilds.
7. **Smoke Test New Containers**: Deploy the applications and verify they start successfully and pass health checks on their internal ports.
8. **Switch Public Routes**: Update Traefik/Dokploy domain routing to route public domains to the new storefront and backend containers.
9. **Reduce Old Compose**: Only after both replacement applications are verified healthy and routing production traffic, reduce the old `docker-compose.prod.yml` to define only the PostgreSQL database service. Keeping automatic Git deployment disabled for the compose project ensures the database is not modified.

## CI Checks (GitHub Actions)

Storefront and backend have separate GitHub Actions workflows:

- **Storefront CI** (`.github/workflows/storefront-ci.yml`) runs on PRs/pushes touching `storefront/**` or the workflow itself. It installs dependencies, lints, tests, and builds with placeholder environment variables. On a successful push to `main`, it calls `DOKPLOY_STOREFRONT_WEBHOOK` via `curl`.
- **Backend CI** (`.github/workflows/backend-ci.yml`) runs on PRs/pushes touching `backend/**` or the workflow itself. It installs dependencies, lints, tests (if any exist), and builds. On a successful push to `main`, it calls `DOKPLOY_BACKEND_WEBHOOK` via `curl`.

If a webhook secret is missing or invalid, the deploy step fails, preventing silent deployment failures.

## Rollback

Automatic rollback is out of scope. If a deployment fails:

1. **Inspect:** Go to the Dokploy **Deployments** tab for the failing application and check the latest deployment logs.
2. **Redeploy a previous commit:** In Dokploy, find a previous successful deployment for that application and click **Redeploy**.
3. **If migration broke state:** Fix the database mismatch before redeploying. The backend will not start if migrations fail.

## Persistence Warning

**Do not delete the `postgres_data` Docker volume.** This volume holds all production data (products, orders, customers, configuration). Deleting it permanently destroys the database.

```bash
# NEVER run this on the VPS:
docker volume rm sunluk-commerce_postgres_data  # ← destructive
```

## Redis

Redis is **not included** in the production stack. If a Medusa feature requires Redis later, it must be added manually to the network and configured.

## What Is Out of Scope

These are intentionally not part of v0:

- Blue/green or canary deployments
- Multi-server orchestration
- Kubernetes
- Automatic database backups
- Automatic Sentry release upload
- Registry-based image builds (images are built on the VPS by Dokploy)
