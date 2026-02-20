---
name: new-migration
description: Draft a new database schema migration for human approval. Analyzes the requested change, generates the Drizzle schema diff and SQL preview, assesses risk, and produces a formatted approval request. NEVER runs db:push without explicit human approval.
user-invocable: false
---

You are helping draft a database schema migration for DriverPath. Schema changes require explicit human approval before any database commands are run. Your job is to prepare everything needed for an informed decision.

## Process

### 1. Understand the Request

Clarify what schema change is needed:
- New table? New column? Modified constraint? Index?
- Which domain does it serve (assessments, auth, content, subscriptions, etc.)?
- Is this additive (safe) or destructive (column removal, type change, NOT NULL addition)?

### 2. Read Current Schema

Read `shared/schema.ts` in full to understand:
- Existing table definitions that are affected
- Naming conventions (snake_case for columns, camelCase for TypeScript keys)
- Existing patterns (e.g., how timestamps are handled, how foreign keys are defined)
- The existing migration files in `migrations/` to understand what migration number comes next

### 3. Draft the Schema Change

Write the proposed addition to `shared/schema.ts` as a code block (do NOT edit the file yet):

```typescript
// Proposed addition to shared/schema.ts
export const newTable = pgTable('new_table', {
  id: serial('id').primaryKey(),
  // ...
});
```

Follow existing patterns exactly — do not introduce new patterns without noting them.

### 4. Generate SQL Preview

Based on the Drizzle schema, write the SQL that Drizzle would generate. Do this mentally — do NOT run `drizzle-kit generate` or `db:push`:

```sql
-- Migration: 0005_add_new_table.sql (example)
CREATE TABLE IF NOT EXISTS "new_table" (
  "id" serial PRIMARY KEY NOT NULL,
  -- ...
);
```

### 5. Assess Risk

Answer these questions:
- **Data loss risk**: Does this change drop or modify existing data?
- **Downtime risk**: Does this require a table lock? (e.g., adding NOT NULL column without default)
- **Rollback plan**: How do we revert if this causes issues?
- **Existing data impact**: Are there rows that would fail the new constraint?
- **Application compatibility**: Do existing queries/code need updating simultaneously?

### 6. List Required Code Changes

Beyond the schema, what else needs to change?
- `shared/schema.ts`: the table/column definition
- `server/storage.ts`: new query methods
- Which application services need updating?
- Do any Zod schemas in routes need updating?
- Does `docs/data/database-schema.md` need a new section?

### 7. Output Approval Request

Format this exactly — do not proceed until the human replies "approved":

---

**DATABASE MIGRATION APPROVAL REQUIRED**

**Change**: [one-line description]
**Migration number**: 0005 (next after current)
**Migration filename**: `migrations/0005_[descriptive_name].sql`

**Schema change**:
```typescript
[proposed shared/schema.ts addition]
```

**SQL preview**:
```sql
[generated SQL]
```

**Risk assessment**:
- Data loss: [None / Low / Medium / High] — [reason]
- Downtime: [None / Possible / Required] — [reason]
- Rollback: `DROP TABLE new_table;` (or description of rollback)

**Additional code changes required**:
- [ ] `shared/schema.ts` — add table definition
- [ ] `server/storage.ts` — add [X] new methods
- [ ] `server/application/[service].ts` — [description]
- [ ] `docs/data/database-schema.md` — document new table

**Reply "approved" to proceed with `npm run migrate-generate`, or provide feedback.**

---

## After Approval

Once the human replies "approved":

1. Edit `shared/schema.ts` with the agreed change
2. Run `npm run migrate-generate` to generate the SQL migration file
3. Review the generated SQL file in `migrations/` and confirm it matches the preview
4. Report the generated filename and any differences from the preview
5. Do NOT run `npm run db:push` — that requires a separate explicit instruction

## What You Must Never Do

- Edit `shared/schema.ts` before receiving "approved"
- Run `npm run migrate-generate` before receiving "approved"
- Run `npm run db:push` without a separate, explicit instruction to do so
- Modify existing migration files in `migrations/`
