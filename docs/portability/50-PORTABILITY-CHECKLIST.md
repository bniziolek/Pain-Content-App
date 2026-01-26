# Portability Checklist (Working Doc)

Use this checklist to drive the migration work and to validate ongoing compliance.

## Repo and commands
- [ ] README has install/run/test/build instructions
- [ ] One command standard exists (Makefile/justfile/scripts)
- [ ] `setup`, `dev`, `test`, `build`, `start` all exist

## Networking
- [ ] App binds to `0.0.0.0`
- [ ] App reads `PORT` from env

## Configuration and secrets
- [ ] All config is env-driven
- [ ] `.env.example` exists and is complete
- [ ] Secrets are not in code or committed files
- [ ] App fails fast with clear env var validation

## Dependencies
- [ ] Lock files committed
- [ ] Runtime version pinned (Node/Python)
- [ ] System deps defined in Dockerfile

## State and persistence
- [ ] Database uses `DATABASE_URL`
- [ ] Migrations exist and run headless
- [ ] No local disk persistence required in production
- [ ] Storage uses an external provider or adapter

## Background work
- [ ] Jobs can run as a separate process
- [ ] Schedules are defined outside the app server (host scheduler or worker)

## Observability
- [ ] `/health` endpoint exists
- [ ] Logs go to stdout/stderr
- [ ] Graceful shutdown works (SIGTERM)

## CI/CD
- [ ] CI runs lint, test, build
- [ ] Optional: CI runs docker build check

## Deployment docs
- [ ] Generic host deployment guide exists
- [ ] Env var list documented
- [ ] Migration steps documented (if applicable)
