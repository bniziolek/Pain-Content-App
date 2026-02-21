# Architecture FAQ and Change Request Checklist

This document helps contributors and agents follow the architecture with minimal back‑and‑forth.

## FAQ

### Where should business logic live?
- In domain services when logic is pure and independent of IO.
- In application services when logic coordinates storage, infra, and domain rules.

### What should routes do?
- Validate input, call an application service, return the response.
- No direct storage/infrastructure calls in routes.

### When should I create a new application service?
- Any time a route orchestrates multiple steps (read/write + email + audit + external API).

### Where do I put Contentful/Stripe/Gmail logic?
- In `server/infrastructure/*` adapters. Application services call these adapters.

### How should I access the database?
- Only through `IStorage` and `DatabaseStorage` in `server/storage.ts`.

### How should I log audits?
- From the application service, not the route. The route passes `req` to the service.

### What if a storage method I need doesn’t exist?
- Add it to `IStorage`, implement it in `DatabaseStorage`, then use it in app services.

### What about shared types?
- Use `@shared/schema` types for data and `shared/api-types.ts` for API payloads.

## Change Request Checklist

Use this checklist when asking for changes so the work stays aligned with the architecture.

- Define the domain (e.g., messaging, assessments, patient portal).
- Specify the intended application service(s) and expected signatures.
- Confirm which domain services (pure logic) are used or need to be created.
- Identify infrastructure adapters that should be used or introduced.
- Confirm `IStorage` methods needed; request additions if missing.
- Require thin routes: validation + app service call + response only.
- Require audit logging in application services.
- Request unit tests for domain/app services as appropriate.
- Request API tests if route behavior changes.

## Example Change Request

"Add patient portal content history export. Create an application service under `server/application/patient-portal/` that reads content views and email logs via `IStorage`, uses CMS fallback for content details, and logs an audit event. Route should only parse input and call the service. Add or update `IStorage` methods if missing, and add API tests for the new route."
