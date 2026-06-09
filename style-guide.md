# Style Guide

## 1. Purpose
This guide defines the working rules for Sunluk Commerce development so local development, updates, and deployment stay predictable.

## 2. Environment Strategy

### Local development
Default local development runs **without Docker** unless a task explicitly requires containerized services.

Use:
- PostgreSQL as a local persistent service
- Redis as a local persistent service
- MinIO as a local local process or external S3-compatible service
- Storefront and backend as local Node.js processes

Required local endpoints:
- `DATABASE_URL=postgres://...@localhost:5432/...`
- `REDIS_URL=redis://localhost:6379`
- `S3_URL=http://localhost:9002` or another local S3-compatible endpoint

### Docker usage
Docker is allowed for:
- staging environments
- production deployment
- isolated repro environments
- CI or integration tasks

Do not make Windows local development depend on services running inside WSL Docker when the backend runs in Windows. That topology is unstable and must be avoided.

## 3. Persistence Rules
Application processes are disposable. Data is not.

Always treat these as persistent:
- PostgreSQL data
- object storage data
- Redis data when it is used for durable workflows or important background state

Never rely on recreating the database as a normal update path.

## 4. Update Model
Updates must be migration-based, not rebuild-based.

Correct update sequence:
1. Update code
2. Install dependencies
3. Run database migrations
4. Restart backend
5. Verify storefront and backend health

Do not use these as routine update steps:
- deleting the database
- recreating the database container from scratch to apply schema changes
- resetting storage to fix application bugs

## 5. Database Rules
- PostgreSQL schema changes must go through migrations
- Keep existing data intact across updates
- Test migrations on realistic data before production rollout
- Never couple application boot to destructive schema recreation

## 6. Backend and Frontend Boundaries
- Commerce logic belongs in Medusa backend modules, workflows, subscribers, and providers
- The Next.js storefront must consume backend APIs and must not duplicate pricing, cart, order, or payment state logic
- Authentication failures must be distinguished from transport failures whenever practical

## 7. Configuration Rules
- Development configuration must prefer `localhost` when services are truly local to the same OS environment
- Do not hardcode temporary WSL IP addresses into committed configuration
- Keep environment-specific values in `.env` files, never in source code
- Production configuration must point to stable service endpoints, not developer machine paths or transient addresses

## 8. Deployment Strategy
Preferred production topology:
- backend as containerized app or managed runtime
- PostgreSQL as managed database or persistent dedicated service
- Redis as managed service or persistent dedicated service
- object storage as S3-compatible managed storage

Recommended rule:
- deploy application separately from stateful services

## 9. Reliability Rules
- Fix root causes, not symptoms
- Prefer boring infrastructure over clever local networking workarounds
- Avoid mixed Windows + WSL + Docker networking unless the entire stack runs in the same environment
- Every non-trivial change must preserve a clean upgrade path

## 10. Code Style
- TypeScript must remain strict across storefront and backend
- Code comments and symbol names must be in English
- User-facing text must be localized according to project rules
- Prefer small, explicit changes over broad refactors
- Reuse existing patterns before introducing new abstractions

## 11. Operational Defaults
For local work, the default stack is:
- Storefront: local process
- Backend: local process
- PostgreSQL: local Windows service
- Redis: local Windows service
- MinIO: local process

For hosted environments, the default stack is:
- Storefront: deployed app
- Backend: deployed app or container
- PostgreSQL: managed or persistent service
- Redis: managed or persistent service
- S3-compatible storage: managed service

## 12. Prohibited Practices
- Running backend on Windows while depending on WSL-only `localhost` services
- Treating container recreation as a schema migration strategy
- Committing machine-specific temporary IP addresses
- Using destructive resets as the normal fix path for local issues

## 13. Decision Rule
When choosing between convenience and long-term maintainability:
- prefer the setup that preserves data
- prefer the setup that supports repeatable updates
- prefer the setup that minimizes networking ambiguity
- prefer the setup that matches future production architecture without copying its complexity unnecessarily
