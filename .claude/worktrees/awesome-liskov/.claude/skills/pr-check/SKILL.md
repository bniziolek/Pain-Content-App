---
name: pr-check
description: Run the full DriverPath pre-PR validation checklist. Verifies smoke tests pass, docs are updated, session breadcrumbs are current, and TypeScript is clean. Run this before opening any pull request.
---

Run the DriverPath pre-PR validation checklist in this exact order. Report results for each step before moving to the next.

## Step 1: Smoke Tests

Run `./scripts/test.sh smoke` and capture the output.
- PASS: all smoke tests green
- FAIL: report which tests failed and stop — do not open a PR with failing smoke tests

## Step 2: TypeScript Check

Run `npm run check`.
- PASS: zero type errors
- FAIL: list the errors — these must be fixed before merge

## Step 3: Detect What Changed

Run `git diff main...HEAD --name-only` to get the list of changed files. Use this to determine which documentation updates are required.

## Step 4: Documentation Audit

Based on the changed files, check whether the required docs were updated:

| If these files changed | Check this doc |
|------------------------|----------------|
| `server/routes/**` with new endpoints | `docs/api/api-reference.md` — new endpoint documented? |
| Any new feature area | `docs/product/FEATURE_CATALOG.md` — feature listed? |
| `.env.example` | `docs/data/ENVIRONMENT_REFERENCE.md` — new var documented? |
| `shared/schema.ts` or `migrations/` | `docs/data/database-schema.md` — schema updated? |
| `server/infrastructure/**` | `docs/data/INTEGRATIONS.md` — integration documented? |
| New script in `scripts/` | `docs/developer/SCRIPTS_AND_TOOLS.md` — script documented? |

For each required doc update: read the doc and the changed code, then confirm whether the doc was updated. Report PASS or FAIL with specifics.

## Step 5: Session Breadcrumbs

Read `docs/agent-sessions/ACTIVE_SESSION.md`.
- Confirm it reflects the current work (what was accomplished, current state, next steps)
- If it's outdated or missing, update it now using the template at `docs/agent-framework/SESSION_HANDOFF_TEMPLATE.md`

## Step 6: HIPAA Check (if applicable)

If any changed files are in `server/routes/`, `server/application/`, or `server/domain/`, invoke the `hipaa-reviewer` subagent to scan the diff.

## Step 7: Architecture Check (if applicable)

If any changed files are in `server/`, invoke the `architecture-validator` subagent to scan the diff.

## Final Summary

Output a concise table:

```
| Check               | Status  | Notes                     |
|---------------------|---------|---------------------------|
| Smoke tests         | ✓ PASS  |                           |
| TypeScript          | ✓ PASS  |                           |
| API docs            | ✓ PASS  | /api/v1/foo documented    |
| Feature catalog     | ✗ FAIL  | Missing entry for X       |
| Session breadcrumbs | ✓ PASS  |                           |
| HIPAA review        | ✓ PASS  |                           |
| Architecture        | ✓ PASS  |                           |

PR Status: READY / NOT READY
```

If NOT READY, list the exact fixes needed before the PR can be opened.
