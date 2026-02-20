# DriverPath — Agent Instructions

This file is auto-loaded by Codex (OpenAI) and any other agents that read `AGENTS.md`.
- **Claude Code** → see `CLAUDE.md`
- **Antigravity IDE** → see `GEMINI.md` (auto-loaded by that IDE)
- **Replit AI** → see `replit.md`

---

## Project Summary

DriverPath is a HIPAA-compliant SaaS platform for physical therapists. It enables clinicians to
curate evidence-based patient education, conduct assessments, and track engagement.

**Stack:** React 19 + TypeScript (frontend) / Node.js + Express + PostgreSQL (backend) / Drizzle ORM

---

## Session Start Protocol

Before writing any code, complete these steps:

1. Read `docs/Agent_guide.md` — single entry point for all project documentation
2. Read `docs/agent-sessions/ACTIVE_SESSION.md` — check for in-progress work
3. Review recent commits to orient yourself: `git log --oneline -10`
4. Read the specific GitHub issue you are solving

---

## Available Commands

```bash
# Development
make dev                      # Start server (port 5000)
make setup                    # Install dependencies
make migrate                  # Run DB migrations

# Testing
make test                     # Run all tests
./scripts/test.sh smoke       # Fast smoke tests (run before marking work done)
./scripts/test.sh feature X   # Test specific feature
./scripts/test.sh full        # Full suite (run before PRs)

# Quality
npm run check                 # TypeScript type check
make build                    # Production build
```

---

## Architecture: 5-Layer Domain-Driven Design

**Full specification:** `docs/architecture/ARCHITECTURE.md`

```
HTTP Request
    ↓
[Routes]         server/routes/           — Validate input (Zod), route to app services
    ↓
[Application]    server/application/      — Orchestrate multi-step workflows
    ↓
[Domain]         server/domain/           — Pure business logic (no DB, no HTTP)
[Infrastructure] server/infrastructure/   — External APIs (email, Stripe, Contentful, PDF)
    ↓
[Storage]        server/storage.ts        — Database access (Drizzle ORM)
```

### Layer Rules (enforced — never bypass)

- Routes call application services or storage for simple operations — never directly call domain
  from routes for complex flows
- Domain services are pure: no database access, no external HTTP calls, no side effects
- Infrastructure services wrap external APIs and translate errors
- Application services own transactions; domain services do not

### Import Conventions

Use barrel exports for clean imports:
```typescript
// Correct
import { createSecureAccessCode } from "../domain/messaging";
import { sendContentEmailFlow } from "../application/messaging";
import { sendContentEmail } from "../infrastructure/email";

// Avoid (unless necessary)
import { createSecureAccessCode } from "../domain/messaging/access-code.service";
```

---

## Testing Requirements

Follow the decision tree in `docs/developer/DEVELOPMENT_WORKFLOW.md`:

| Change type | Test location |
|-------------|---------------|
| New API endpoint | `tests/api/` |
| Authentication flow | `tests/e2e/auth.spec.ts` |
| UI feature (clinician) | `tests/e2e/roles/clinician.spec.ts` |
| UI feature (admin) | `tests/e2e/roles/admin.spec.ts` |
| Patient portal | `tests/e2e/roles/patient-portal.spec.ts` |
| Critical path / smoke | `tests/e2e/` |

**Always run `./scripts/test.sh smoke` before declaring any task complete.**

---

## Data-testid Conventions

Required on all interactive UI elements:
- Buttons: `data-testid="button-[action]"` (e.g., `button-submit`, `button-cancel`)
- Inputs: `data-testid="input-[field]"` (e.g., `input-email`)
- Cards: `data-testid="card-[type]-[id]"`
- Modals: `data-testid="modal-[name]"`

---

## Documentation to Update

| Change type | Update this file |
|-------------|-----------------|
| New feature | `docs/product/FEATURE_CATALOG.md` + `replit.md` |
| New API endpoint | `docs/api/api-reference.md` |
| New env var | `docs/data/ENVIRONMENT_REFERENCE.md` |
| Architecture change | `docs/architecture/ARCHITECTURE.md` |
| New script | `docs/developer/SCRIPTS_AND_TOOLS.md` |

---

## HIPAA Compliance Rules

These are non-negotiable and cannot be skipped:

1. All PHI access must be logged via `logClinicianAction()` in `server/infrastructure/audit/`
2. Never expose access codes in API responses, logs, or console output
3. Hash secrets with PBKDF2 (never MD5, SHA1, or plain bcrypt)
4. Patient sessions must expire after 24 hours — do not modify this timeout
5. Feature-flag-gated routes must use `requireFeatureFlag` middleware

---

## Actions That Require Human Approval

Stop and ask the human before taking any of these actions:

- Creating new database tables or modifying schema (`shared/schema.ts`, `migrations/`)
- Adding or removing environment variables
- Modifying `.github/workflows/` (CI/CD)
- Changing authentication, authorization, or session logic
- Adding new npm dependencies
- Deleting files, branches, or migrations

---

## Session End: Leave Breadcrumbs

Before ending your session, update `docs/agent-sessions/ACTIVE_SESSION.md`.
Use the template at `docs/agent-framework/SESSION_HANDOFF_TEMPLATE.md`.

The next agent depends on this file to pick up where you left off.

---

## Key File Locations

| What | Path |
|------|------|
| Shared DB schema + types | `shared/schema.ts` |
| Backend entry point | `server/index.ts` |
| Route registration | `server/routes/index.ts` |
| Storage interface | `server/storage.ts` |
| Frontend root | `client/src/` |
| Environment template | `.env.example` |
| Agent session state | `docs/agent-sessions/ACTIVE_SESSION.md` |
| Full agent framework | `docs/agent-framework/AGENT_EXPECTATIONS.md` |
