# Run, Build, and Config Requirements

This file defines what your repo must contain so you can run and deploy the app outside Replit.

## 1) Standard commands (required)
Pick one of these standards and enforce it:
- `Makefile` (recommended for mixed stacks)
- `justfile`
- `package.json` scripts (Node-centric)
- `taskfile.yml`

### Minimum command contract
Your repo must support:

- `setup`: installs dependencies
- `dev`: starts the app for local development
- `test`: runs unit and integration tests
- `build`: produces production build artifacts
- `start`: runs the app in production mode

**Example command mapping**
- Node/Next:
  - `setup`: `npm ci`
  - `dev`: `next dev`
  - `build`: `next build`
  - `start`: `next start`
- Python/FastAPI:
  - `setup`: `pip install -r requirements.txt`
  - `dev`: `uvicorn app.main:app --reload`
  - `test`: `pytest`
  - `start`: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

## 2) Port binding and network interface (required)
To be deployable on most platforms:
- bind to `0.0.0.0` (not `localhost`)
- listen on `PORT` env var

**Requirement**
- the app reads `PORT` at runtime
- default can be `3000` or `8000` locally, but production uses env

## 3) Configuration and env vars (required)
### Rules
- no hardcoded environment-specific values
- no secrets in code
- no secrets in committed files

### Required repo files
- `.env.example` (committed)
- `.env` (not committed)
- secret handling documented in README

### Fail-fast validation
On startup, validate required env vars and stop with a clear message:
- `DATABASE_URL`
- `AUTH_*` keys if applicable
- `STORAGE_*` keys if applicable
- `BASE_URL` if needed for callbacks

## 4) Dependency locking and version pinning (required)
### Node
- commit `package-lock.json` or `pnpm-lock.yaml`
- specify Node version:
  - `.nvmrc` or `engines.node` in `package.json`

### Python
- prefer pinned dependencies:
  - `requirements.txt` with versions or `poetry.lock`
- specify Python version:
  - `runtime.txt`, `.python-version`, or documented in README

### System dependencies
If you need OS packages (image libs, pdf libs):
- define them in Dockerfile
- do not rely on Replit preinstalls

## 5) Logging (required)
To work on most hosts:
- log to stdout/stderr
- keep logs structured when possible (JSON logging is ideal)

**Do not**
- write logs to local files as the primary output
- rely on Replit console-only behaviors

## 6) Health checks and graceful shutdown (required)
### Health endpoint
Add:
- `GET /health` returning 200 with a simple payload

### Graceful shutdown
Handle SIGTERM:
- stop accepting new connections
- close DB connections
- flush logs
- exit cleanly

## 7) Repo structure expectations
Your repo should make it obvious what is:
- app code
- infrastructure and deployment
- docs

Suggested structure:
```
/app or /src
/infrastructure
  Dockerfile
  docker-compose.yml
/docs
  portability docs
```

## 8) Common portability anti-patterns
- Reading config from a platform-specific file path
- Assuming a writable local filesystem for persistent state
- Using an in-memory singleton for data that must persist
- Skipping a deterministic `build` step
- Allowing “works on my machine” runtime drift (no lock files)
