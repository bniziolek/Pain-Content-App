# Ongoing Requirements and Governance

Portability stays real only if you treat it like a product requirement.

## 1) Add portability to your PR Definition of Done
Every PR should meet:
- no new platform-specific dependencies
- new config is env-driven and documented in `.env.example`
- tests updated or added
- build remains deterministic

## 2) Enforce via CI gates
CI should fail if:
- lock files missing or changed unexpectedly
- build fails
- tests fail

Optional:
- fail if Docker build fails

## 3) Track “platform coupling” as tech debt
Add a simple log of portability debt:
- Replit-only dependency discovered
- file persistence added
- non-deterministic build introduced
- missing env var documentation

Maintain it as:
- `/docs/portability/PORTABILITY-DEBT.md`

## 4) Coding standards that protect portability
- never reference absolute machine paths
- do not read secrets from local files in production
- do not store state in memory if it matters after a restart
- do not assume write access to the filesystem

## 5) Release management
- create a versioned release artifact:
  - container tag or build version
- keep rollback steps documented

## 6) Operational requirements for growth
As usage grows, portability also means:
- separate concerns (web vs worker processes)
- isolate external services behind adapters
- avoid coupling to one provider’s proprietary features unless it is a deliberate strategy decision

## 7) Quarterly portability review (simple)
Every quarter, validate:
- local dev still works from a clean clone
- docker build still works
- deploy guide still matches reality
- no new coupling introduced
