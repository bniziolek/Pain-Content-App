# Data, External Services, and Background Jobs Requirements

Portability depends on how your app stores state and how it runs async work.

## 1) Databases (required)
### Rule
Your app must connect to a database via an env var:
- `DATABASE_URL`

### Local dev requirement
You must have a local dev path that does not require manual setup:
- docker-compose with Postgres is recommended

### Schema migration requirement
If your app uses a relational DB:
- migrations must exist
- migrations must run non-interactively

Example:
- `make migrate` runs migrations
- migrations run in CI for safety (optional but strong)

## 2) Replit DB or local file persistence
If you use Replit DB or store JSON files as “the database”:
- treat this as a portability blocker
- plan a migration to a real database

### Migration approach (practical)
1. Define the target schema in Postgres
2. Build an export script from the current store
3. Build an import script to Postgres
4. Validate record counts and spot-check data
5. Cut over behind a feature flag
6. Remove the old storage layer

## 3) File uploads and storage (required if you store files)
### Rule
Do not store user-uploaded files on local disk in production.

Portable choices:
- S3-compatible object storage
- managed storage from your hosting provider
- a pluggable “storage adapter” interface in code

### Env vars
- `STORAGE_PROVIDER`
- `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` (or equivalents)

## 4) Caching and queues (optional but common)
If you need background work or caching:
- Redis is the most portable default

Local dev:
- run Redis in docker-compose

Prod:
- use managed Redis or a hosted Redis service

## 5) Background jobs and scheduled tasks (required if you have async work)
### Rule
Jobs must be runnable outside the app server process.

Options:
1. Separate worker process (recommended)
2. Managed scheduler triggers an HTTP endpoint
3. Queue-based workers (best for scale)

### “Portable” job design
- the job logic lives in app code
- the entry point can run from CLI:
  - `node scripts/run_job.js`
  - `python -m jobs.some_job`
- the scheduler is environment-specific, but the job code is not

## 6) Email, SMS, and third-party APIs
### Rule
Integrations must be driven by env vars and a provider config layer.

Example env vars:
- `EMAIL_PROVIDER`
- `SENDGRID_API_KEY` or `SMTP_URL`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`

## 7) Auth and sessions
### Rule
Your auth cannot depend on platform-only features.

Portable patterns:
- JWT-based sessions
- server sessions stored in Redis
- external auth providers (OIDC)

Common env vars:
- `AUTH_SECRET`
- `OAUTH_CLIENT_ID`
- `OAUTH_CLIENT_SECRET`
- `OAUTH_CALLBACK_URL`

## 8) Observability (required for production)
At minimum:
- request logging
- error tracking integration (optional but strong)
- basic metrics hook (optional)

Portable approach:
- log to stdout
- integrate an error tracker through env vars, not hardcoding

## 9) Definition of Done for this area
- [ ] Database connections use env vars only
- [ ] Migrations exist and run headless
- [ ] File storage is external or uses an adapter
- [ ] Jobs can run as a separate process without Replit
- [ ] No Replit DB dependencies remain (or you have a migration plan)
