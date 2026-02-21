# DriverPath Multi-Agent Collaboration Framework

This document is the authoritative source of truth for how all coding agents
(Claude, Codex, Antigravity, Replit) operate on this project. It defines
expectations, conventions, and the handoff system that enables seamless
collaboration across agents and sessions.

---

## 1. Why This Framework Exists

Multiple AI coding agents work on this codebase across different tools and
sessions. Without a shared framework, agents make conflicting decisions, break
architectural patterns, duplicate work, or lose context between sessions.

This framework ensures:
- Every agent starts with the same context
- Architectural decisions are consistent and documented
- Work is never silently dropped between sessions
- Humans can inspect agent decisions and reasoning at any time

---

## 2. Agent Roster and Entry Points

| Agent | Platform | Entry File | Auto-loaded? |
|-------|----------|------------|--------------|
| Claude Code | Anthropic Claude | `CLAUDE.md` | Yes |
| Codex | OpenAI | `AGENTS.md` | Yes |
| Antigravity IDE | Gemini / Antigravity | `GEMINI.md` | Yes (project-level) |
| Replit AI | Replit | `replit.md` | Yes |

Each entry file is a concise set of project-specific instructions. All entry
files reference this document for the full framework.

> **Note on Antigravity:** Antigravity IDE auto-loads `GEMINI.md` from the
> project root. It does not read `CLAUDE.md` or `AGENTS.md`.

---

## 3. Session Start Protocol

Every agent session, without exception, begins with:

### Step 1 — Read Orientation Docs (5 minutes max)
```
docs/Agent_guide.md          ← Start here; links to all project docs
docs/agent-sessions/ACTIVE_SESSION.md  ← Any in-progress work to continue
```

### Step 2 — Orient to Recent Changes
```bash
git log --oneline -10        # What happened recently?
git status                   # Any uncommitted work in this worktree?
```

### Step 3 — Load the Task
- Find and read the GitHub issue you are solving
- Identify: What changed? What layer does it touch? What tests are needed?
- If no issue is assigned, ask the human before starting work

### Step 4 — Plan Before Coding
- Write a brief task breakdown before writing code
- Identify which files need to change
- Flag any decisions that require human approval (see Section 6)

---

## 4. Architecture Rules

Full specification: `docs/architecture/ARCHITECTURE.md`

### The 5-Layer Stack (enforce strictly)

```
┌──────────────────────────────────────┐
│  Routes (server/routes/)             │  ← HTTP only: validate + route
├──────────────────────────────────────┤
│  Application (server/application/)   │  ← Orchestrate + transactions
├──────────────────────────────────────┤
│  Domain (server/domain/)             │  ← Pure business logic
│  Infrastructure (server/infrastructure/) │  ← External APIs
├──────────────────────────────────────┤
│  Storage (server/storage.ts)         │  ← Database access only
└──────────────────────────────────────┘
```

### Layer Rules (never violate)

**Routes layer:**
- Parse and validate all input with Zod before doing anything else
- Call application services for multi-step workflows
- Call storage directly only for simple, single-table reads
- Never contain business logic
- Always use `next(error)` for error propagation

**Application layer:**
- Own all multi-step workflows and transactions
- Receive dependencies (storage, services) as parameters — do not import globals
- Return domain entities or DTOs; never return raw DB rows

**Domain layer:**
- Pure functions preferred — accept inputs, return outputs, no side effects
- No database access whatsoever
- No external API calls whatsoever
- No Node.js I/O (fs, http, etc.)
- Export typed interfaces for all inputs and outputs

**Infrastructure layer:**
- Wrap one external service per module (Gmail, Stripe, Contentful, Puppeteer)
- Translate external errors into domain-understandable errors
- Never contain business logic

**Storage layer:**
- Drizzle ORM only
- Implement the `IStorage` interface for all operations
- Use transactions for multi-table operations

### Common Violations to Avoid

```typescript
// WRONG — route calling storage directly for complex flow
router.post("/send", async (req, res) => {
  const emailLog = await storage.createEmailLog(data); // bypass app layer
  await sendEmail(data); // bypass infrastructure abstraction
});

// CORRECT — route delegates to application service
router.post("/send", async (req, res) => {
  const emailLog = await sendContentEmailFlow({ storage, audit, data });
  res.json(emailLog);
});
```

```typescript
// WRONG — domain service making external call
export function generatePdf(data: PdfData): Promise<Buffer> {
  return puppeteer.launch()...  // NOT in domain layer
}

// CORRECT — that belongs in server/infrastructure/pdf/
```

---

## 5. Code Conventions

Full style guide: `docs/developer/STYLE_GUIDE.md`

### File Naming
- Domain services: `{name}.service.ts`
- Route files: `{resource}.ts`
- Infrastructure services: `{provider}.service.ts`
- Barrel exports: always `index.ts`

### Function Naming
- Domain: action verbs — `createSecureAccessCode`, `calculateTagScores`
- Storage: `create{Entity}`, `get{Entity}ById`, `update{Entity}`, `delete{Entity}`

### Type Naming
- Result types: `{Name}Result`
- Config types: `{Name}Config`
- Context types: `{Name}Context`

### UI Selectors (required for testability)
Every interactive UI element needs a `data-testid` attribute:
- Buttons: `button-[action]`
- Inputs: `input-[field-name]`
- Cards: `card-[type]-[id]`
- Modals: `modal-[name]`

---

## 6. Decision Gate: What Needs Human Approval

When you encounter any of the following, **stop and ask the human** before
proceeding. Document the decision in `docs/agent-sessions/ACTIVE_SESSION.md`.

| Category | Examples |
|----------|---------|
| Schema changes | New tables, column changes, `shared/schema.ts`, `migrations/` |
| Environment | Adding/removing env vars, `.env.example` changes |
| CI/CD | Any change to `.github/workflows/` |
| Security | Auth logic, session config, RBAC, HIPAA audit logging |
| Dependencies | Adding/removing npm packages |
| Destructive operations | File deletions, branch deletions, migration rollbacks |
| New patterns | Architectural patterns not already present in the codebase |
| External integrations | New third-party services or webhooks |

If in doubt, ask. It costs nothing to confirm; it costs a lot to fix unauthorized changes.

---

## 7. Documentation Requirements

Agents are responsible for keeping documentation current. Stale docs are bugs.

### When to Update What

| You changed... | Update these docs |
|---------------|-------------------|
| A feature or behavior | `docs/product/FEATURE_CATALOG.md` |
| An API endpoint | `docs/api/api-reference.md` |
| An environment variable | `docs/data/ENVIRONMENT_REFERENCE.md` |
| Architecture or layer structure | `docs/architecture/ARCHITECTURE.md` |
| A script or Make command | `docs/developer/SCRIPTS_AND_TOOLS.md` |
| Significant feature (any) | `replit.md` System Architecture section |
| A new external integration | `docs/data/INTEGRATIONS.md` |

### In-Code Documentation
- Add comments only where logic is non-obvious
- Complex algorithms need a comment explaining *why*, not *what*
- HIPAA-sensitive code must have a comment noting the compliance requirement
- WIP code must have a `// TODO[AGENT]: description` marker

---

## 8. Testing Requirements

Full strategy: `docs/testing/TEST_STRATEGY.md`

### Decision Tree: What Tests to Write

```
New API endpoint added?
  → Yes: add to tests/api/{feature}.test.ts
         cover: 200 success, 400 validation, 401 unauth, 403 unauthorized

New UI feature or workflow?
  → Yes: identify the right spec file:
         - Auth → tests/e2e/auth.spec.ts
         - Content/Library → tests/e2e/library.spec.ts
         - Clinician feature → tests/e2e/roles/clinician.spec.ts
         - Admin feature → tests/e2e/roles/admin.spec.ts
         - Patient portal → tests/e2e/roles/patient-portal.spec.ts
         - Critical path → tests/e2e/ (smoke level)

Pure domain logic changed?
  → Yes: add unit tests alongside the service file (if test infra supports it)
         at minimum, ensure existing API tests still cover the logic
```

### Test Verification Before Closing Any Task

```bash
./scripts/test.sh smoke        # Must pass
./scripts/test.sh feature X   # Must pass for the feature you changed
```

Full suite (`./scripts/test.sh full`) is required before PRs.

---

## 9. HIPAA Compliance Rules

These are non-negotiable. Any agent deviation from these rules is a bug.

1. **Audit logging**: All PHI access must call `logClinicianAction()`.
   Located at `server/infrastructure/audit/audit.service.ts`.

2. **Access code security**:
   - Hash with PBKDF2 (never MD5, SHA1, bcrypt, or plain storage)
   - Tiered lockout: block after 3, 6, and 9 failed attempts
   - Never include access codes in API responses
   - Never log access codes (even partially) to console

3. **Session management**:
   - Patient sessions expire after 24 hours
   - Clinician cookies: 30-day expiration, HttpOnly, Secure flags
   - Sessions stored server-side using `patient_sessions` table

4. **Feature flags**: Gate new features behind `requireFeatureFlag` middleware
   before enabling in production.

5. **Data minimization**: Never collect or store PHI beyond what is required
   for the documented use case.

---

## 10. The Breadcrumb System (Session Handoffs)

This is how work is passed between agents and sessions without losing context.

### The Session State File

`docs/agent-sessions/ACTIVE_SESSION.md` is the single source of truth for
what is currently in progress. It is overwritten at the end of every session.

**Every agent session MUST update this file before ending.**

### The Decision Log

`docs/agent-sessions/DECISION_LOG.md` accumulates key decisions across all
sessions. Append — never overwrite — when you make a significant decision.

### In-Code Breadcrumbs

When work is interrupted mid-task, leave a `// TODO[AGENT]:` comment at the
exact line where work should resume:

```typescript
// TODO[AGENT]: Add validation for the maxAttempts field before calling lockout service.
// Context: lockout service is at server/domain/patient/auth.service.ts:45
// Next step: add Zod schema check in the route before reaching this line.
```

---

## 11. Git and PR Conventions

- Branch naming: `feature/issue-{number}-short-description`
- Commit messages: imperative mood, reference issue number
  - `feat: add access code expiry check (#42)`
  - `fix: correct scoring weight for tag overlap (#37)`
- PRs: describe what changed, why, and how to test it
- Always run full tests before opening a PR
- Do not merge your own PR — leave it for human review unless explicitly told otherwise

---

## 12. Handling Uncertainty

When you are unsure about any of the following, **stop and ask**:

- The intended behavior of a feature
- Which layer a piece of logic belongs in
- Whether a change has security or HIPAA implications
- Whether a change affects other features
- What the correct test approach is

State what you found, what you're uncertain about, and what options you see.
The human will decide. Do not guess on architectural or security questions.

---

## 13. Cross-Agent Compatibility Notes

### Claude Code
- Reads `CLAUDE.md` at session start
- Supports multi-file edits and bash commands
- Can run tests directly

### Codex (OpenAI)
- Reads `AGENTS.md` at session start
- Operates via shell commands in a sandboxed environment
- File edits are made via patches

### Antigravity IDE
- Auto-loads `GEMINI.md` from the project root (does NOT read `CLAUDE.md` or `AGENTS.md`)
- Powered by Gemini models; follows the same protocols as all other agents
- Session handoff notes are in `docs/agent-sessions/ACTIVE_SESSION.md` (committed to git)

### Replit AI
- Reads `replit.md` at session start
- Operates within the Replit environment (Node 20, PostgreSQL 16)
- Use `make` commands for all operations (they are environment-portable)

### Portability Rule
All commands used in agent work must be expressed as `make` targets or
`./scripts/` calls. Raw npm scripts and direct binary invocations are allowed
but should be wrapped in the standard commands for cross-agent consistency.
