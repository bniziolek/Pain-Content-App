# Operations Runbook

This runbook is for operators and on-call responders. It explains how to run, deploy, and triage the system in production.

## Quick Facts

- **App type**: Node/Express server + React client
- **Primary runtime**: `server/index.ts`
- **Health check**: `GET /api/health`
- **Database**: PostgreSQL (via Drizzle)
- **Payments**: Stripe
- **Email**: Gmail or Resend (via Replit connectors)
- **CMS**: Contentful (optional)

## Standard Start/Stop

### Development

```bash
npm install
npm run dev
```

### Production

```bash
npm run build
npm run start
```

## Health Checks

- **Basic health**: `GET /api/health` should return `{ status: "ok" }`.
- **Auth check**: `GET /api/user` should return user info for an authenticated session.

## Deploy Checklist (High Level)

1. Confirm env vars in `docs/data/ENVIRONMENT_REFERENCE.md`.
2. Run tests or smoke tests (see `docs/testing/TEST_STRATEGY.md`).
3. Ensure database migrations are applied: `npm run db:push`.
4. Deploy and verify `GET /api/health`.

Detailed checklist: `docs/operations/deployment-checklist.md`.

## Incident Triage

### Step 1: Identify the Symptom

- Errors in UI? Confirm server logs and network calls.
- API errors? Confirm the endpoint and error code.
- Payment issues? Check Stripe webhook events.

### Step 2: Confirm System Health

- `GET /api/health`
- Database connectivity (verify `DATABASE_URL` in env)

### Step 3: Check Recent Changes

- Review recent deploy changes or migration steps.
- Check if background jobs were toggled.

### Step 4: Roll Back (If Needed)

- Roll back to the last known good deployment.
- Re-run `GET /api/health` and a smoke test.

## Background Jobs

Background jobs are controlled by environment flags:

- `BACKGROUND_JOBS_ENABLED` (default enabled)
- `STRIPE_SYNC_ENABLED` (default enabled)

If jobs are disabled, subscription sync may stop.

## Stripe Webhooks

- Endpoint: `POST /api/stripe/webhook`
- Required env: `STRIPE_WEBHOOK_SECRET`
- Failure symptoms: subscription state out of sync

## Logging Notes

- Logs are currently written to stdout/stderr.
- For production, ensure logs are captured by your hosting provider.

## Backups and Recovery (TODO)

Add backup and restore procedures once the storage provider is finalized.
