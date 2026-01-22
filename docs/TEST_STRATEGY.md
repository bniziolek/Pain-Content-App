# Test Strategy

This document describes the automated and manual testing approach.

## Test Layers

1. **Type checks** (fast, static)
2. **API tests** (Vitest)
3. **E2E tests** (Playwright)
4. **Manual test plan** (see `docs/test-plan.md`)

## Quick Commands

```bash
npm run check
npx vitest run
npx playwright test
```

## Detailed Testing

### API Tests (Vitest)

- Config: `vitest.config.ts`
- Tests live in `tests/api/`

Run all:

```bash
npx vitest run
```

Run a single file:

```bash
npx vitest run tests/api/auth.test.ts
```

### E2E Tests (Playwright)

- Config: `playwright.config.ts`
- Tests live in `tests/e2e/`
- Dev server is started automatically by Playwright

Run all:

```bash
npx playwright test
```

Run a single spec:

```bash
npx playwright test tests/e2e/auth.spec.ts
```

### Test Runner Script

Use the interactive test menu:

```bash
./scripts/test.sh
```

This script provides smoke tests, role-based tests, and feature-focused runs.

## When to Run What

- **Local changes**: `npm run check` + relevant API/E2E tests
- **Before merging**: full API suite + relevant E2E coverage
- **Release**: full API + full E2E + manual test plan

## Test Data Assumptions

- Some tests assume seeded data exists.
- If a test fails due to missing data, run the seed helper described in `docs/DEVELOPER_ONBOARDING.md`.

## Known Gaps (TODO)

- Add unit tests for domain services.
- Add contract tests for external integrations (Stripe, Gmail, Contentful).
