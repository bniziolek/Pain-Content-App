# DriverPath — Antigravity (Gemini) Agent Instructions

This file is auto-loaded by the Antigravity IDE. It contains project-specific
instructions for all Gemini-based agent sessions on this codebase.

---

## Project Summary

DriverPath is a HIPAA-compliant SaaS platform for physical therapists. It enables clinicians to
curate evidence-based patient education, conduct assessments, and track patient engagement.

**Stack:** React 19 + TypeScript (frontend) / Node.js + Express + PostgreSQL (backend) / Drizzle ORM

---

## Session Start Protocol

Before writing any code, complete these steps in order:

1. Read `docs/Agent_guide.md` — single entry point for all project documentation
2. Read `docs/agent-sessions/ACTIVE_SESSION.md` — check for in-progress work from prior sessions
3. Run `git log --oneline -10` to orient to recent changes
4. Read the specific GitHub issue you are solving

---

## Available Commands

```bash
# Development
make dev                      # Start development server (port 5000)
make setup                    # Install dependencies
make migrate                  # Run database migrations

# Testing
make test                     # Run all tests
./scripts/test.sh smoke       # Fast smoke tests — run before marking any work done
./scripts/test.sh feature X   # Test a specific feature
./scripts/test.sh full        # Full suite — required before opening PRs

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
[Application]    server/application/      — Orchestrate multi-step workflows, own transactions
    ↓
[Domain]         server/domain/           — Pure business logic (no DB, no HTTP, no side effects)
[Infrastructure] server/infrastructure/   — External APIs (email, Stripe, Contentful, PDF)
    ↓
[Storage]        server/storage.ts        — Database access via Drizzle ORM only
```

### Layer Rules (never bypass)

- Routes validate with Zod then call application services — never contain business logic
- Application services orchestrate and own transactions — call domain + infrastructure + storage
- Domain services are pure: no database, no HTTP, no external calls whatsoever
- Infrastructure services wrap one external API each and translate errors
- Storage layer uses Drizzle ORM exclusively, implements the `IStorage` interface

### Import Conventions

```typescript
// Correct — import from barrel exports
import { createSecureAccessCode } from "../domain/messaging";
import { sendContentEmailFlow } from "../application/messaging";
import { sendContentEmail } from "../infrastructure/email";
```

---

## Testing Requirements

Follow the decision tree in `docs/developer/DEVELOPMENT_WORKFLOW.md`:

| Change type | Test location |
|-------------|---------------|
| New API endpoint | `tests/api/` |
| Auth flow | `tests/e2e/auth.spec.ts` |
| Clinician UI feature | `tests/e2e/roles/clinician.spec.ts` |
| Admin UI feature | `tests/e2e/roles/admin.spec.ts` |
| Patient portal | `tests/e2e/roles/patient-portal.spec.ts` |
| Critical path | `tests/e2e/` (smoke level) |

**Always run `./scripts/test.sh smoke` before declaring any task complete.**

---

## UI Selector Convention

All interactive elements require `data-testid` attributes:
- Buttons: `data-testid="button-[action]"`
- Inputs: `data-testid="input-[field-name]"`
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

## HIPAA Compliance Rules (non-negotiable)

1. All PHI access must be logged via `logClinicianAction()` in `server/infrastructure/audit/`
2. Never expose access codes in API responses, logs, or console output
3. Hash secrets with PBKDF2 — never MD5, SHA1, or plain bcrypt
4. Patient sessions must expire after 24 hours — do not modify this timeout
5. Feature-gated routes must use `requireFeatureFlag` middleware

---

## Actions That Require Human Approval

Stop and ask the human before taking any of these actions:

- Creating new database tables or modifying `shared/schema.ts` or `migrations/`
- Adding or removing environment variables
- Modifying `.github/workflows/` (CI/CD pipeline)
- Changing authentication, authorization, or session logic
- Adding new npm dependencies
- Deleting files, branches, or migrations

---

## Session End: Leave Breadcrumbs

Before ending your session, overwrite `docs/agent-sessions/ACTIVE_SESSION.md`
using the template at `docs/agent-framework/SESSION_HANDOFF_TEMPLATE.md`.

The next agent (on any platform) reads this file to pick up where you left off.
This file is tracked in git — commit it with your other changes.

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
