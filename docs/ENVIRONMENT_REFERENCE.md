# Environment Reference

This is a consolidated list of environment variables used by the codebase, with notes on where they are used. It complements `docs/environment-variables.md`.

## Required (Production)

| Variable | Purpose | Where Used |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `server/storage.ts`, background jobs |
| `SESSION_SECRET` | Session encryption | `server/auth.ts` |
| `NODE_ENV` | Runtime mode | `server/index.ts`, `server/auth.ts` |
| `PORT` | Server port | `server/index.ts` |

## Required When Using Stripe

| Variable | Purpose | Where Used |
|---|---|---|
| `STRIPE_SECRET_KEY` | Stripe API key | Stripe client setup |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature | `server/routes/webhooks.ts` |
| `STRIPE_PUBLISHABLE_KEY` | Client Stripe config | `server/application/subscription/get-stripe-config.ts` |
| `APP_URL` | Return URLs for checkout/portal | `server/routes/subscription.ts` |

## Optional Integrations

| Variable | Purpose | Where Used |
|---|---|---|
| `CONTENTFUL_SPACE_ID` | Contentful space ID | `server/infrastructure/cms/contentful.service.ts` |
| `CONTENTFUL_ACCESS_TOKEN` | Contentful API token | `server/infrastructure/cms/contentful.service.ts` |

## Replit Runtime (Auto-Provided)

| Variable | Purpose | Where Used |
|---|---|---|
| `REPLIT_DEV_DOMAIN` | Dev base URL | assessment invites, messaging |
| `REPLIT_DOMAINS` | Production domains | background jobs |
| `REPLIT_DEPLOYMENT` | Production flag | Stripe client |
| `REPLIT_CONNECTORS_HOSTNAME` | Connector host | Stripe, Gmail, Resend, scripts |
| `REPL_IDENTITY` | Connector auth | Stripe, Gmail, Resend, scripts |
| `WEB_REPL_RENEWAL` | Connector auth fallback | Stripe, Gmail, Resend, scripts |

## Feature Flags / Runtime Toggles

| Variable | Purpose | Where Used |
|---|---|---|
| `BACKGROUND_JOBS_ENABLED` | Toggle background jobs | `server/application/background-jobs/start-background-jobs.ts` |
| `STRIPE_SYNC_ENABLED` | Toggle Stripe sync | `server/application/background-jobs/start-background-jobs.ts` |

## Scripts and Tooling

| Variable | Purpose | Where Used |
|---|---|---|
| `GITHUB_OWNER` | GitHub org/user | `scripts/create-github-issue.ts`, `scripts/create-github-issues.ts` |
| `GITHUB_REPO` | GitHub repo | `scripts/create-github-issue.ts`, `scripts/create-github-issues.ts` |

## Notes

- If you use Replit, most `REPLIT_*` variables are auto-populated.
- If `CONTENTFUL_*` is missing, content falls back to the database.
- If Stripe variables are missing, subscription endpoints return 503.
- For more guidance, see `docs/environment-variables.md`.
