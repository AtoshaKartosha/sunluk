# Repository Guidelines: Sunluk Commerce

All agents operating in this repository must strictly adhere to the guidelines, architectural boundaries, and orchestration model defined below.

---

## 1. Orchestration Model: Write-Review Flow

Development follows a strict separation of **planning** and **execution**.

### 1.1 Main Agent (Orchestrator)
Responsible for:
- Plan development and architecture design
- Authoring and reviewing **flow documents** (via `flow-first` and `flow-review` skills)
- Task delegation to sub-agents via the `task` tool
- Final code and flow review before task closure
- Running `sync-flows` as the final quality gate

**Hard Rules:**
- The Main Agent must **never** perform direct codebase search, research, or direct code edits if the work can be delegated.
- The Main Agent is the **sole authority** for flow documents. Sub-agents must not modify `flows/` directly.

### 1.2 Sub-Agents (Executors via `task` tool)
Responsible for:
- Codebase searching and structural research
- File modifications, feature implementation, refactoring
- Writing and running targeted tests

**Hard Rules:**
- Sub-agents must skip formatting and linting passes — these are executed globally by the Main Agent at the end of the work batch.
- Sub-agents must **never** modify flow documents. If implementation diverges from the flow, the sub-agent must stop and escalate to the Main Agent.

---

## 2. Flow-Based Development Lifecycle (Flow-First)

Non-trivial tasks must adhere to the four-stage flow-first lifecycle. Trivial changes (copy fixes, style-only, isolated refactors with existing tests) are exempt.

### Mandatory Flow Triggers
A feature **must** start with a flow when it involves any of:
- Multiple states or transitions
- Async behavior, real-time messages, reconnects, stale state
- Session lifecycle or multi-user/multi-agent coordination
- Persistence, save/load, double-trigger risk, or side effects
- Hidden information, permissions, authorization, or role-specific views
- Cross-flow boundaries (events shared between flows)

### The Four Stages

| Stage | Skill | Owner | Gate |
|---|---|---|---|
| **1. Design** | `flow-first` | Main Agent | — |
| **2. Review** | `flow-review` | Main Agent | Must pass Approval Bar before coding starts |
| **3. Implement** | Sub-agents | Sub-agents | Code must match the approved flow |
| **4. Sync** | `sync-flows` | Main Agent | Must pass before task is marked done |

### Flow-Code Contract (Critical)
1. **No code is written** until `flow-review` approves the flow document.
2. **No flow is updated by sub-agents.** If a sub-agent discovers the flow is wrong during implementation, they must **stop coding**, leave a clear comment, and return the task to the Main Agent with the finding.
3. **No task is closed** until `sync-flows` passes on every affected flow.
4. **Drift is a blocker.** A flow that contradicts the code is worse than no flow — it actively misleads future agents.

---

## 3. Flow Artifacts Governance

### Directory Layout
```
flows/
├── ARCHITECTURE.md      # System-level cross-flow map (mandatory for multi-flow projects)
├── features/            # Feature-level behavior
├── sessions/            # Session lifecycle (if applicable)
├── api/                 # API contract and integration flows
├── auth/                # Authentication and authorization flows
├── realtime/            # WebSocket, reconnect, fanout
├── integrations/        # External service integrations
└── templates/           # Reusable templates
```

### Flow Document Ownership
| Action | Allowed Agent |
|---|---|
| Create a new flow | Main Agent (via `flow-first`) |
| Update an existing flow | Main Agent (via `flow-first`) |
| Review a flow | Main Agent (via `flow-review`) |
| Fill Implementation Trace (Section 12) | Sub-agent (during implementation) |
| Verify flow-code sync | Main Agent (via `sync-flows`) |

### Architecture Map Rules
- `flows/ARCHITECTURE.md` must exist if the project contains more than one flow document.
- Every arrow in the map must have matching incoming/outgoing events in both flow documents.
- Orphan events (declared but never received) are **blockers** in `flow-review`.

### Flow Lifecycle Management (Archiving)

To keep active folders clean and focused, the Main Agent (Orchestrator) manages the lifecycle of flow documents. Active directories (e.g., `flows/features/`) must only contain flows in active design, review, or implementation.

#### When to Archive a Flow
A flow document must be moved to the archive directory (`flows/archive/`) when:
1. ✅ **Implementation is complete** (all sub-agent code changes are done and merged).
2. ✅ **`sync-flows` passes** with no drift or unresolved implementation bugs.
3. ✅ **Feature is shipped** to production or marked as fully released.
4. ✅ **No active changes** or developments are planned for the next 30+ days.

#### Archive Procedure (Main Agent Only)
1. Verify that `sync-flows` returned an `IN SYNC` status on the target flow.
2. Move the flow document to the archive folder, organizing it by time-period/release (e.g., quarter/year):
   ```bash
   mv flows/features/feature-x.md flows/archive/2026-Q2/feature-x.md
   ```
3. Update `flows/ARCHITECTURE.md`:
   - Change the flow's subgraph style or append an `[archived]` style (e.g., grayed-out or dashed lines).
   - Add a comment/label next to the flow node, e.g., `[ARCHIVED 2026-05-29]`.
4. Commit the change with conventional message: `chore(flows): archive feature-x flow after production release`.

#### When NOT to Archive
- ❌ The flow has unresolved product questions or blockers.
- ❌ `sync-flows` reveals unresolved code-documentation drift.
- ❌ The feature is in active development (even if paused temporarily).
- ❌ The flow is referenced by other active flows (verify ARCHITECTURE.md connections).

#### Unarchive Procedure
If development resumes on an archived flow:
1. Move the file back to active directory: `mv flows/archive/2026-Q2/feature-x.md flows/features/feature-x.md`.
2. Update `flows/ARCHITECTURE.md` to restore its active visual styling.
3. Run `flow-review` on the unarchived flow before implementing any new changes (to ensure it has not rotted with respect to the rest of the ecosystem).
4. Commit: `chore(flows): unarchive feature-x for new development`.

#### Automated Archive Checks (Weekly)
On a regular basis (e.g., every Monday or session startup), the Main Agent should scan for active flows that:
- Have an `Implementation Trace` status of "Complete".
- Passed the latest `sync-flows` audit.
- Have not been modified for 30+ days.
- Are not referenced as active dependencies by other active flows.

**Action:** Present an archive recommendation to the user:
> "The following flows appear complete and inactive:
> - flows/features/feature-x.md (last modified: 2026-04-28)
> - flows/features/feature-y.md (last modified: 2026-05-01)
> 
> Move them to flows/archive/? (yes/no/defer)"
---

## 4. Project Structure Template

```
sunluk/
├── storefront/              # Next.js storefront (customer-facing shop)
│   ├── src/
│   └── tests/
├── backend/                 # MedusaJS commerce backend and custom modules
│   ├── src/
│   ├── medusa-config.ts
│   └── integration-tests/
├── flows/                   # Flow documents (see §3)
├── docs/                    # Non-flow documentation
└── scripts/                 # Build/deploy utilities
```

**Commerce Boundary Rule:** Product/catalog/cart/order/payment logic belongs in MedusaJS modules, workflows, subscribers, and payment providers. The Next.js storefront must consume Medusa Store API and must not duplicate commerce state machines or pricing/order logic.

**Deterministic Core Rule:** Business-critical rules, payment state transitions, order workflows, stock handling, and integration mapping must be deterministic, typed, and tested. Never use LLMs or dynamic scripts for commerce-critical decisions.

### 4.1 Target Architecture

```
Customer
  ↓
Next.js storefront
  ↓
Medusa Store API
  ↓
Medusa backend
  ↓
PostgreSQL

Manager
  ↓
Medusa Admin
  ↓
Medusa backend
  ↓
PostgreSQL
```

### 4.2 Platform Components

| Layer | Technology |
|---|---|
| **Frontend storefront** | Next.js, TypeScript, Tailwind CSS, shadcn/ui, next-intl |
| **Commerce backend** | MedusaJS |
| **Database** | PostgreSQL |
| **Cache / jobs** | Redis |
| **Admin** | Medusa Admin |
| **Payments (DE)** | Mollie or Stripe, plus PayPal and Klarna |
| **Payments (RU)** | Custom Medusa payment provider for YooKassa, CloudPayments, T-Bank, or SBP |
| **Storage** | S3-compatible storage |
| **Search (later)** | Meilisearch or Typesense |
| **Monitoring** | Sentry, uptime monitoring, and backups |

---

## 5. Build, Test, and Development Commands

### 5.1 Environment Isolation (Mandatory)
All agents must execute runtime commands strictly within the project's isolated environment:
- **JavaScript dependencies:** project-local `node_modules/`
- **Forbidden:** Global package installation, system-wide tooling, `--user` flags.

### 5.2 Command Matrix

| Action | Command |
|---|---|
| **Docker: start all** | `docker compose up -d` |
| **Docker: stop all** | `docker compose down` |
| **Storefront dev server** | `npm run dev --prefix storefront` |
| **Storefront build** | `npm run build --prefix storefront` |
| **Storefront linter** | `npm run lint --prefix storefront` |
| **Medusa dev server** | `npm run dev --prefix backend` |
| **Medusa build** | `npm run build --prefix backend` |
| **Backend tests** | `npm run test --prefix backend` |
| **Backend linter** | `npm run lint --prefix backend` |
| **Global format/lint** (Main Agent only) | `npm run lint --prefix storefront && npm run lint --prefix backend` |

### 5.3 Sub-Agent Lint Exemption
Sub-agents must **skip** linting and formatting passes during implementation. These are run once by the Main Agent after all sub-tasks in the batch complete.

---

## 6. Coding Style & Conventions

| Area | Rule |
|---|---|
| **Type Safety** | Strict TypeScript across storefront and Medusa backend; validate external API/payment/storage boundaries explicitly. |
| **Naming** | camelCase for variables/functions, PascalCase for React components and TypeScript types/classes, kebab-case for route and file-system URL segments. |
| **Comments** | Code comments and symbol names must be in **English**. |
| **User-facing text** | Use `next-intl`; keep storefront/admin-facing customer copy localized according to product requirements. |
| **Styling** | Tailwind CSS with shadcn/ui primitives; avoid ad-hoc component systems. |

---

## 7. Commit & PR Guidelines

### Commit Message Format
Strict `prefix: message` pattern (Conventional Commits):

```
<type>(<scope>): <subject>

[optional body]
[optional footer]
```

### Valid Types
`feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `ci`

### Scope Convention
Scope must match the flow or module touched:
- `feat(calc): ...`
- `fix(hs-picker): ...`
- `chore(flow-review): ...`
- `docs(flows): add feature-X flow document`

### Flow-First Commit Pattern
When implementing a flow-first feature, the commit history must reflect the lifecycle:
1. `docs(flows): add flow document for feature-X`
2. `feat(calc): implement feature-X per flow`
3. `test(calc): add targeted tests for feature-X flow`
4. `chore(flows): sync feature-X flow with implementation`

### PR Requirements
A PR that touches non-trivial logic must include:
- [ ] Flow document created/updated in `flows/`
- [ ] `flow-review` approval recorded (linked in PR description)
- [ ] `sync-flows` passed on the final diff
- [ ] Implementation Trace (Section 12 of the flow) filled with actual file paths

---

## 8. Agent Boundaries & Escalation

### When Sub-Agents Must Escalate
A sub-agent must stop work and return the task to the Main Agent when:
1. The flow document is **ambiguous or incomplete** for the implementation task.
2. The implementation **diverges** from the approved flow (even for a "good reason").
3. A **new edge case** emerges during coding that is not in the flow's Section 7.
4. A **cross-flow boundary** is discovered that is not in `ARCHITECTURE.md`.

### When Main Agent Must Re-Invoke Flow Skills
1. After any sub-agent escalation about flow divergence → `flow-first` (update) → `flow-review` (re-approve) → re-delegate.
2. Before marking any task done → `sync-flows`.
3. When a new non-trivial feature is requested → `flow-first`.

### Forbidden Actions
- **Sub-agents:** Modifying `flows/` directly, closing tasks without `sync-flows` pass.
- **Main Agent:** Writing implementation code, bypassing `flow-review` for non-trivial features, merging PRs with failing `sync-flows`.

---

## 9. Project-Specific Configuration

> These values are project-specific and override the templates above.

```yaml
PROJECT_NAME: "Sunluk Commerce"

FRONTEND_ROLE: "Customer-facing storefront"
FRONTEND_STACK: "Next.js + TypeScript + Tailwind CSS + shadcn/ui + next-intl"

COMMERCE_BACKEND: "MedusaJS"
ADMIN_STACK: "Medusa Admin"

DATABASE: "PostgreSQL"
CACHE_AND_JOBS: "Redis"
STORAGE: "S3-compatible storage"
SEARCH_LATER: "Meilisearch or Typesense"
MONITORING: "Sentry + uptime monitoring + backups"

PAYMENTS_DE: "Mollie or Stripe + PayPal + Klarna"
PAYMENTS_RU: "Custom Medusa payment provider for YooKassa / CloudPayments / T-Bank / SBP"

STOREFRONT_DEV_CMD: "npm run dev --prefix storefront"
STOREFRONT_BUILD_CMD: "npm run build --prefix storefront"
STOREFRONT_LINT_CMD: "npm run lint --prefix storefront"

MEDUSA_DEV_CMD: "npm run dev --prefix backend"
MEDUSA_BUILD_CMD: "npm run build --prefix backend"
MEDUSA_TEST_CMD: "npm run test --prefix backend"
MEDUSA_LINT_CMD: "npm run lint --prefix backend"

GLOBAL_LINT_CMD: "npm run lint --prefix storefront && npm run lint --prefix backend"

TYPE_SAFETY_RULE: "Strict TypeScript across storefront and Medusa backend"
LOCALE_RULE: "next-intl for storefront localization"
STYLING_RULE: "Tailwind CSS + shadcn/ui"
```
