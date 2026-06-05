# CI/CD Flow

## 1. Intent

Provide a boring, convenient CI/CD baseline for Sunluk Commerce using GitHub Actions for checks and Dokploy for deployment on one VPS.

Success criteria:

- Pull requests run repeatable checks before merge: install, lint, build, and available backend tests.
- Pushes to `main` are eligible for Dokploy auto-deploy from the configured GitHub repository/branch.
- Dokploy owns deployment orchestration, Traefik routing, domains, TLS, runtime environment variables, and service restarts.
- Runtime secrets live in Dokploy/VPS environment configuration, not in GitHub Actions.
- Production data persists through deploys via Docker named volumes, especially `postgres_data`.
- CI/CD does not seed, reset, or otherwise mutate production data beyond Medusa migrations run during deployment.

Non-negotiables:

- Storefront and backend remain separate runtime services in the compose stack.
- Commerce state remains backend-owned; CI/CD does not calculate or duplicate commerce state.
- Local Windows helper scripts are not used in Linux CI or Dokploy deployment.
- Redis is not part of the v0 production stack unless the backend starts requiring it explicitly.

## 2. Scope

In scope:

- GitHub Actions workflow for PR/push checks.
- Dokploy-friendly Docker build definitions for storefront and Medusa backend.
- Dokploy-friendly production Docker Compose definition for one VPS.
- Operator-facing Dokploy setup instructions, env variables, domains, deploy/rollback notes, and persistence warnings.

Out of scope for v0:

- SSH-based deploy workflow.
- Custom VPS deploy script.
- Blue/green deployment.
- Multi-server orchestration.
- Kubernetes.
- Automatic database backups.
- Automatic Sentry release upload.
- Registry-based image builds.

Deferred decisions:

- Exact production domain names.
- Whether to add automated database backups through Dokploy or an external backup service.
- Whether Redis should be enabled later for production-grade Medusa cache/events/workflows.

## 3. Actors and Permissions

| Actor | Can do | Cannot do | Authority source |
|---|---|---|---|
| Developer | Open PR, inspect CI failures | Deploy production manually without Dokploy/GitHub permission | GitHub repository permissions |
| GitHub Actions CI | Install dependencies and run checks | Read production secrets, mutate VPS state | Workflow permissions and repo checkout |
| Dokploy admin/operator | Configure GitHub provider, env variables, domains, deployments, rollbacks | Bypass application migration safety without changing compose/config | Dokploy project permissions |
| Dokploy deployment engine | Clone repository, build compose services, restart services | Generate production secrets, reset database | Dokploy provider and compose configuration |
| Production services | Read runtime env and serve traffic | Mutate CI workflow state | Docker Compose and application config |

## 4. Diagrams

### PR/push CI flow

```mermaid
flowchart TD
  A[GitHub event: pull_request or push] --> B{Workflow file present?}
  B -->|no| C[No CI signal]
  B -->|yes| D[Checkout repository]
  D --> E[Setup Node and npm cache]
  E --> F[Install storefront/backend dependencies with npm ci]
  F --> G{Install succeeded?}
  G -->|no| X[Fail CI]
  G -->|yes| H[Run storefront lint and build]
  H --> I{Storefront passed?}
  I -->|no| X
  I -->|yes| J[Run backend lint, tests-if-present, and build]
  J --> K{Backend passed?}
  K -->|no| X
  K -->|yes| L[CI success]
```

### Dokploy deploy state machine

```mermaid
stateDiagram-v2
  [*] --> Idle
  Idle --> Eligible: push to Dokploy-configured branch
  Eligible --> Blocked: GitHub CI failed or branch mismatch
  Eligible --> DokployQueued: CI passed or operator deploys manually
  DokployQueued --> BuildingImages: repository clone/fetch succeeded
  DokployQueued --> Blocked: Git provider unavailable or ref missing
  BuildingImages --> Migrating: Docker Compose build succeeded
  BuildingImages --> Blocked: image build failed
  Migrating --> Restarting: Medusa migrations succeeded
  Migrating --> Blocked: migration failed
  Restarting --> Healthy: services restarted and routes respond
  Restarting --> Degraded: service start or health check failed
  Healthy --> Idle: deployment complete
  Blocked --> Idle: operator fixes cause and redeploys
  Degraded --> Idle: operator inspects Dokploy logs and redeploys previous commit
```

### Deployment data flow

```mermaid
flowchart LR
  GH[GitHub Repository] -->|provider + branch| Dokploy[Dokploy Project]
  Dokploy -->|clone/build| Compose[docker-compose.prod.yml]
  DokployEnv[Dokploy env variables] --> Compose
  Compose --> Storefront[Next.js storefront container]
  Compose --> Backend[Medusa backend container]
  Compose --> Postgres[(PostgreSQL named volume/service)]
  Backend -->|migrations| Postgres
  Storefront -->|Store API URL| Backend
  Traefik[Dokploy/Traefik routes] --> Storefront
  Traefik --> Backend
```

## 5. State and Projections

Authoritative state:

- Git commit SHA is the deployment target.
- GitHub workflow conclusion is the CI authority.
- Dokploy project configuration is the deployment authority.
- Dokploy/VPS environment variables are the runtime secret authority.
- PostgreSQL named volume is the production data authority.

Projections:

- GitHub check summary shows CI status per commit.
- Dokploy deployment log shows clone/build/migration/restart status.
- Dokploy service status/logs show runtime state.

## 6. Events/Actions

| Direction | Name | Payload | Allowed when | Reject reason |
|---|---|---|---|---|
| Incoming | `github:pull-request-opened` | `{ ref, sha }` | PR targets repository branches | Workflow missing or dependency install fails |
| Incoming | `github:push-main` | `{ ref: main, sha }` | CI workflow is configured | Branch not selected in Dokploy, CI failed |
| Incoming | `dokploy:auto-deploy` | `{ provider, branch, sha }` | Dokploy provider is connected and branch matches | Git provider unavailable, branch mismatch, CI gate failed if configured |
| Incoming | `dokploy:manual-deploy` | `{ ref, sha? }` | Operator has Dokploy project permission | Ref cannot be cloned/built |
| Internal | `ci:checks-completed` | `{ sha, status }` | All commands complete | Any required command exits non-zero |
| Internal | `deploy:images-built` | `{ services }` | Dockerfiles and compose valid | Docker build failure |
| Internal | `deploy:migrations-applied` | `{ service: backend }` | Backend image built and DB reachable | Migration exits non-zero |
| Internal | `deploy:services-restarted` | `{ services }` | Compose up succeeds | Container start/route failure |

Cross-flow boundaries: None for v0. CI/CD operates on infrastructure and does not emit commerce domain events.

## 7. Edge Cases

| Edge case | Expected behavior |
|---|---|
| Two pushes to `main` happen close together | Dokploy queues/serializes deployments for the configured app; operator can inspect deployment history. |
| PR changes only docs | CI still runs the baseline unless path filters are later added; correctness over clever skips for v0. |
| Backend test suite has no tests | Workflow skips backend tests only when no backend test files exist; real test failures fail CI. |
| Storefront build needs public backend URL/key | CI uses safe non-production public values for build-time env; production runtime values stay in Dokploy. |
| Dokploy env variable missing | Compose/build fails fast; GitHub Actions does not synthesize production secrets. |
| Docker build fails in Dokploy | Dokploy marks deployment failed; previous running containers/data are not intentionally removed by project config. |
| Migration fails | Deployment fails before the new backend is considered healthy; operator must fix DB/app mismatch before retry. |
| Service restart fails | Dokploy shows a failed/degraded deployment; operator can inspect logs and redeploy a previous commit. Automatic rollback is out of scope v0. |
| Operator accidentally removes `postgres_data` volume | Production data is lost unless backups exist; docs must warn not to delete named volumes and recommend backups. |
| Redis-dependent Medusa feature is enabled later | Flow/compose must be updated to add Redis intentionally before setting `REDIS_URL`. |

## 8. Side Effects

- GitHub Actions consumes runner minutes.
- Dokploy clones/fetches the repository on the VPS.
- Dokploy builds Docker images locally on the VPS.
- Deployment may run Medusa migrations against production PostgreSQL.
- Deployment restarts storefront/backend/PostgreSQL services defined by production Compose.
- Dokploy/Traefik routes public domains to the configured services.

## 9. Schemas Touched

Expected files:

- `.github/workflows/ci.yml`
- `storefront/Dockerfile`
- `backend/apps/backend/Dockerfile`
- `docker-compose.prod.yml`
- `docs/ci-cd.md`
- `flows/ARCHITECTURE.md`
- `flows/integrations/ci-cd.md`

Removed from v0:

- `.github/workflows/deploy-vps.yml`
- `scripts/deploy-vps.sh`

## 10. Targeted Tests

| Layer | Behavior | File/command | Status |
|---|---|---|---|
| Workflow syntax | GitHub Actions YAML parses as valid YAML | Python/PyYAML parse of `.github/workflows/ci.yml`, `docker-compose.prod.yml` | Passed |
| Storefront build | Storefront compiles with CI env | `npm run build --prefix storefront` | Passed |
| Backend build | Backend compiles/builds | `npm run build --prefix backend` | Passed |
| Storefront lint | Existing lint stays error-free | `npm run lint --prefix storefront` | Passed with 7 existing warnings, 0 errors |
| Backend lint | Existing lint stays error-free | `npm run lint --prefix backend` | Passed; Turbo reported no lint tasks configured |
| Backend tests | Backend test suite policy does not mask real failures | Backend test-file lookup found no backend `*.test.*`/`*.spec.*` files; CI skips only in that case | Passed |
| Dokploy compose | Production Compose avoids Redis and keeps Postgres named volume | Static review + YAML parse | Passed |

## 11. Implementation Plan

1. Remove SSH VPS deployment workflow and deploy script.
2. Keep GitHub Actions CI only.
3. Update production Compose for Dokploy: backend, storefront, postgres; no Redis.
4. Keep Dockerfiles compatible with Dokploy compose builds.
5. Replace operator docs with Dokploy setup, env, domains, persistence, rollback notes.
6. Update architecture map with infrastructure flow.
7. Run targeted verification and fill implementation trace.

## 12. Implementation Trace

Status: Implemented.

Code files:

- `.github/workflows/ci.yml`
- `storefront/Dockerfile`
- `backend/apps/backend/Dockerfile`
- `docker-compose.prod.yml`
- `docs/ci-cd.md`
- `flows/ARCHITECTURE.md`
- `flows/integrations/ci-cd.md`

Removed files:

- `.github/workflows/deploy-vps.yml`
- `scripts/deploy-vps.sh`

Validation commands/results:

- `npm run lint --prefix storefront` — passed with 7 existing warnings, 0 errors.
- `npm run build --prefix storefront` — passed.
- `npm run lint --prefix backend` — passed; Turbo reported no lint tasks configured.
- `npm run build --prefix backend` — passed.
- Backend test-file lookup — no backend `*.test.*`/`*.spec.*` files found; CI skips tests only when no test files exist.
- Python/PyYAML parse of `.github/workflows/ci.yml` and `docker-compose.prod.yml` — passed.
- `docker compose -f docker-compose.prod.yml config` — not run because Docker CLI is unavailable on this workstation.

Implementation notes:

- Dokploy is the CD authority; GitHub Actions now handles CI only.
- Production runtime env variables are configured in Dokploy, not GitHub.
- Production Compose includes PostgreSQL, backend, and storefront; Redis is intentionally omitted for v0.
- PostgreSQL data persists in the `postgres_data` named volume.
- Backend startup command runs `npx medusa db:migrate && npm run start`; no reset or seed is run.

## 13. Open Questions

Resolved by user:

- Deployment platform: Dokploy on one VPS.
- Redis: not used for v0 production stack.

Deferred:

- Exact production domain names.
- Automated backup provider/schedule.
- Registry-based image builds.
- Automatic rollback strategy.

## 14. Review Checklist

| Item | Status |
|---|---|
| Intended behavior, not current implementation | Ready |
| Diagrams include decisions/rejection paths | Ready |
| Forbidden paths explicit | Ready |
| Concrete edge cases named | Ready |
| Tests derivable from flow | Ready |
| Expected files named | Ready |
| Open questions surfaced | Ready |
| Cross-flow boundaries declared | Ready |
