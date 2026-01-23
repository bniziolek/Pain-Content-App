# Developer Onboarding

This guide helps a new developer get the application running locally.

## Prerequisites

- Node.js 20+
- npm
- PostgreSQL (or Replit PostgreSQL)

## 1) Install Dependencies

```bash
npm install
```

## 2) Configure Environment Variables

See `docs/data/ENVIRONMENT_REFERENCE.md`.

Minimum required for local development:

- `DATABASE_URL`
- `SESSION_SECRET`

Optional but recommended:

- `CONTENTFUL_SPACE_ID`, `CONTENTFUL_ACCESS_TOKEN`
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- `APP_URL` (used for Stripe return URLs)

## 3) Set Up the Database

```bash
npm run db:push
```

If you need seed data, the seed helper is in `server/seed.ts`:

```bash
npx tsx -e "import { seedDatabase } from './server/seed'; seedDatabase();"
```

This creates an admin user and sample content.

## 4) Start the App

```bash
npm run dev
```

Then open `http://localhost:5000`.

## 5) Run Tests

- Type check: `npm run check`
- API tests: `npx vitest run`
- E2E tests: `npx playwright test`
- Test menu: `./scripts/test.sh`

See `docs/testing/TEST_STRATEGY.md` for details.

## 6) Common Local Issues

- **No DB connection**: verify `DATABASE_URL`.
- **Auth issues**: ensure `SESSION_SECRET` is set.
- **Stripe not configured**: expect 503 from subscription endpoints.
