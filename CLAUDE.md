# DriverPath — Claude Code Instructions

## Project Summary
DriverPath is a SaaS platform for physical therapists. It uses a 5-layer domain-driven architecture
with a React/TypeScript frontend and Node.js/Express/PostgreSQL backend.

---

## Session Start Protocol (do this first, every time)

1. Read `docs/Agent_guide.md` — links to all authoritative docs
2. Check `docs/agent-sessions/ACTIVE_SESSION.md` — in-progress work from a prior session
3. Run `git log --oneline -10` to orient yourself to recent changes
4. Read the GitHub issue you're tasked with before writing any code

---

## Key Commands

```bash
make dev               # Start development server (port 5000)
make test              # Run all tests
make build             # Production build
make migrate           # Run DB migrations
npm run check          # TypeScript type check
./scripts/test.sh smoke       # Fast smoke test (run before declaring work done)
./scripts/test.sh feature X   # Test a specific feature
./scripts/test.sh full        # Full test suite (run before PRs)
```

---

## Architecture Rules (Non-Negotiable)

Full details: `docs/architecture/ARCHITECTURE.md`

```
Routes → Application Services → Domain + Infrastructure → Storage
```

| Layer | Location | Rule |
|-------|----------|------|
| Routes | `server/routes/` | Validate (Zod) + call application services only |
| Application | `server/application/` | Orchestrate workflows, manage transactions |
| Domain | `server/domain/` | Pure business logic — no DB, no HTTP, no external calls |
| Infrastructure | `server/infrastructure/` | External APIs (email, Stripe, Contentful, PDF) |
| Storage | `server/storage.ts` | Drizzle ORM database access only |

**Never bypass a layer.** Routes never call storage directly. Domain never calls external APIs.

---

## Before Writing Any Code

- Read the existing code in the area you're changing
- Understand the pattern already in use before introducing a new one
- New patterns require explicit human approval

---

## Testing Requirements

Follow the decision tree in `docs/developer/DEVELOPMENT_WORKFLOW.md`:
- New API endpoint → `tests/api/`
- UI feature or workflow → `tests/e2e/` or `tests/e2e/roles/`
- Run `./scripts/test.sh smoke` before declaring any work complete

---

## Session End: Leave Breadcrumbs

Before ending a session, update `docs/agent-sessions/ACTIVE_SESSION.md` using the
template at `docs/agent-framework/SESSION_HANDOFF_TEMPLATE.md`. Record:
- What was accomplished this session
- Current state (working / broken / partial)
- Exact next steps for the next agent
- Key decisions made and the reasoning
- Any blockers or open questions for the human

---

## What Requires Human Approval

Do NOT proceed without explicit confirmation from the human for:
- New database tables or schema changes (`shared/schema.ts`, `migrations/`)
- Adding or changing environment variables
- Changes to `.github/workflows/` CI pipeline
- Security changes (auth flows, access control, HIPAA audit logging)
- Adding new third-party npm dependencies
- Removing or force-pushing branches

---

## Docs to Update When Making Changes

| Change type | Update this doc |
|-------------|----------------|
| New feature | `docs/product/FEATURE_CATALOG.md` + `replit.md` |
| New API endpoint | `docs/api/api-reference.md` |
| New env var | `docs/data/ENVIRONMENT_REFERENCE.md` |
| Architecture change | `docs/architecture/ARCHITECTURE.md` |
| New script | `docs/developer/SCRIPTS_AND_TOOLS.md` |

---

## Key File Paths

| What | Where |
|------|-------|
| Shared schema (DB types) | `shared/schema.ts` |
| Frontend entry | `client/src/main.tsx` |
| Backend entry | `server/index.ts` |
| Route registration | `server/routes/index.ts` |
| Storage interface | `server/storage.ts` |
| Environment vars template | `.env.example` |

---

## HIPAA Rules

- All PHI access must call `logClinicianAction()` for audit logging
- Never log or expose access codes in responses or server console
- Use PBKDF2 for access code hashing and scrypt for password hashing (never MD5, SHA1, or plain bcrypt)
- Patient sessions expire after 24 hours — do not change this

---

## Full Agent Framework

See `docs/agent-framework/AGENT_EXPECTATIONS.md` for the complete multi-agent
collaboration framework, including breadcrumb conventions and decision logging.
