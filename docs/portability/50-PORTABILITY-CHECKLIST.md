# Portability Checklist (Working Doc)

Use this checklist to drive the migration work and to validate ongoing compliance.

**Last reviewed:** 2024-01-26

## Repo and commands
- [x] README has install/run/test/build instructions
- [x] One command standard exists (Makefile/justfile/scripts)
- [x] `setup`, `dev`, `test`, `build`, `start` all exist

## Networking
- [x] App binds to `0.0.0.0`
- [x] App reads `PORT` from env

## Configuration and secrets
- [x] All config is env-driven
- [x] `.env.example` exists and is complete
- [x] Secrets are not in code or committed files
- [x] App fails fast with clear env var validation

## Dependencies
- [x] Lock files committed
- [x] Runtime version pinned (Node/Python)
- [x] System deps defined in Dockerfile

## State and persistence
- [x] Database uses `DATABASE_URL`
- [x] Migrations exist and run headless
- [x] No local disk persistence required in production
- [x] Storage uses an external provider or adapter

## Background work
- [x] Jobs can run as a separate process
- [x] Schedules are defined outside the app server (host scheduler or worker)

## Observability
- [x] `/health` endpoint exists
- [x] Logs go to stdout/stderr
- [x] Graceful shutdown works (SIGTERM)

## CI/CD
- [x] CI runs lint, test, build
- [x] Optional: CI runs docker build check

## Deployment docs
- [x] Generic host deployment guide exists
- [x] Env var list documented
- [x] Migration steps documented (if applicable)
