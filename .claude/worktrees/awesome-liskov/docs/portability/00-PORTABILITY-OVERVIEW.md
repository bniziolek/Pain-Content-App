# Portability Overview

## What “portable” means
Your app is **portable** when it meets all of these conditions:

1. **You can run it anywhere** with the same commands and the same expected behavior:
   - local machine
   - Docker container
   - any hosting provider (PaaS, containers, VMs, Kubernetes)
2. **No platform-specific dependencies** are required to function:
   - no Replit-only databases, auth, schedulers, or “magic” runtime assumptions
3. **Configuration is externalized**:
   - the app reads configuration from environment variables at runtime
   - secrets never live in code or committed files
4. **Build and runtime are reproducible**:
   - dependencies are locked
   - runtime versions are pinned
   - build output is deterministic
5. **State is managed correctly**:
   - the app is stateless (or explicitly uses external services for state)
   - storage, databases, and background jobs are clearly defined and replaceable

## Why portability breaks in Replit projects
Portability usually fails because of one or more of these:
- The project runs only because Replit sets up defaults (ports, run commands, system deps).
- Secrets and config rely on Replit-specific “Secrets” behavior without a portable fallback.
- The app uses Replit DB or local filesystem as a database.
- The build is implicit (no deterministic `build` step).
- The dev workflow depends on “always on” compute assumptions.

## Core portability principles (non-negotiable)
### Principle 1: One way to run the app
Your repo must define standard commands so any environment can run the app:

- `setup` installs dependencies
- `dev` runs a local development server
- `test` runs automated tests
- `build` produces production artifacts
- `start` runs production mode

### Principle 2: Runtime configuration via env vars
Everything that differs between environments goes to env vars:
- ports
- database URLs
- auth credentials
- external API keys
- feature flags
- base URLs

### Principle 3: Stateless app + external state
A portable web app treats the app container as disposable:
- no writing to local disk for persistent state
- any persistence goes to a database or object storage
- caching or queues use a managed service (or a local docker service for dev)

## Portability Definition of Done (DoD)
You can call the app “portable” when you can prove each item below.

### Build/run proof
- [ ] Local: `make dev` runs successfully
- [ ] Local: `make test` runs successfully
- [ ] Docker: `docker build` succeeds
- [ ] Docker: `docker run` starts and serves requests
- [ ] Production mode: `make build` + `make start` works locally

### Config proof
- [ ] `.env.example` exists and includes every required env var
- [ ] Secrets are not committed and not hardcoded
- [ ] App fails fast with clear messages if required env vars are missing

### Data and state proof
- [ ] Any database has a portable connection string (for example `DATABASE_URL`)
- [ ] Migrations exist and can run headless (no manual steps)
- [ ] File uploads go to an external storage service or a clearly-defined alternative
- [ ] No Replit-only data services remain (or there is a documented replacement)

### Deployment proof
- [ ] A “generic host” deploy guide exists (containers or PaaS)
- [ ] Health endpoint exists (for example `GET /health`)
- [ ] Graceful shutdown works (SIGTERM)

### Governance proof
- [ ] CI enforces lint/test/build and optionally a docker build check
- [ ] Portability requirements are added to the team’s “Definition of Done” for PRs

## What changes going forward
Portability is not a one-time project. It becomes a **build contract**:
- new features must not introduce platform coupling
- new dependencies must be lockable and reproducible
- new services must be pluggable (via env vars and adapters)
