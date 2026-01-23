# Scripts and Tools

This document describes the scripts available in `scripts/` and `script/`.

## npm Scripts (package.json)

- `npm run dev`: start the server in development.
- `npm run dev:client`: start the Vite client dev server only.
- `npm run build`: build the production bundle.
- `npm run start`: run the production build.
- `npm run check`: TypeScript type checking.
- `npm run db:push`: apply Drizzle schema to the database.

## Test Runner Script

`./scripts/test.sh` provides a guided menu to run API and E2E tests.

Example:

```bash
./scripts/test.sh smoke
```

## Screenshot Capture (Dev)

Generate documentation screenshots in dev:

```bash
npx playwright test tests/e2e/capture-screenshots.spec.ts --reporter=list
```

Screenshots are written to `docs/assets/screenshots/`.

If the Playwright web server fails to start (for example, due to `tsx` IPC limits),
start the server yourself and tell Playwright to reuse it:

```bash
PW_SKIP_WEB_SERVER=1 PW_BASE_URL=http://localhost:5000 \\
  npx playwright test tests/e2e/capture-screenshots.spec.ts --reporter=list
```

Or run the one-shot script:

```bash
npm run capture:screenshots
```

## Git and Workflow Scripts

- `scripts/git.sh`: helper for git tasks (see file for usage).
- `scripts/cleanup-branches.sh`: remove merged or stale branches.
- `scripts/sync-with-dev.sh`: update local branch against main/dev.

## GitHub Issue Helpers

- `scripts/create-github-issue.ts`
- `scripts/create-github-issues.ts`
- `scripts/create-enhancement-issues.ts`
- `scripts/create-planned-issues.ts`
- `scripts/create-pro-tier-issue.ts`
- `scripts/fetch_issue.ts`
- `scripts/find-github-repo.ts`

These typically use `GITHUB_OWNER` and `GITHUB_REPO` env vars.

## Stripe Seed Script

- `scripts/seed-stripe-products.ts`

Note: this script currently imports `server/stripeClient`, which has been removed in this branch. It likely needs updating before use.

## Build Helper

- `script/build.ts` is used by `npm run build`.
