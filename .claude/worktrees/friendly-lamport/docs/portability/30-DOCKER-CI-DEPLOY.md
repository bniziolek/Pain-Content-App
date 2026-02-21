# Docker, CI, and Deployment Requirements

This file defines what you need to deploy reliably on other platforms.

## 1) Docker (recommended as the portability backbone)
Docker gives you one artifact that can run on:
- Render
- Fly.io
- Railway
- AWS ECS
- GCP Cloud Run
- Azure Container Apps
- Kubernetes

### Required files
- `Dockerfile`
- `.dockerignore`

### Strongly recommended
- `docker-compose.yml` for local dev dependencies (Postgres, Redis)

### Dockerfile expectations
- deterministic installs (lock files)
- separate build and runtime steps when needed
- expose the correct port
- use `PORT` at runtime

## 2) CI (required)
CI is how you stop portability regressions.

Minimum CI checks:
- install dependencies
- lint
- unit tests
- build

Optional but valuable:
- `docker build` check
- basic integration tests (spin up services via docker-compose)

### GitHub Actions (typical)
Workflow triggers:
- pull requests
- main branch merges

## 3) Deployment: what must be true regardless of host
Most hosts require:
- a web process that binds to `0.0.0.0:$PORT`
- health checks
- environment variables configured in the host UI or pipeline
- a single start command or container entrypoint

## 4) PaaS vs Containers vs VMs
### PaaS (easiest)
- quick deploys
- good for early stage
- limited control

### Containers (best balance)
- predictable environment
- portable across providers
- simple rollback story

### VMs (most control)
- you own the OS
- more ops overhead

## 5) Production hard requirements
These make your app reliable on most platforms:
- graceful shutdown
- health endpoint
- startup readiness checks if the app needs DB connectivity
- no reliance on local disk persistence

## 6) Deployment checklist (generic)
- [ ] Choose hosting mode: PaaS or container
- [ ] Set env vars in host
- [ ] Set database and storage services
- [ ] Run migrations
- [ ] Deploy web process
- [ ] Validate health endpoint
- [ ] Validate logs and error reporting

## 7) Keeping Replit as “preview hosting” (hybrid)
You can keep Replit as a shareable preview environment if you want:
- develop locally with your IDE
- push to GitHub
- pull into Replit for demo and quick validation
- host production elsewhere

This reduces Replit credit burn without losing the “easy share” benefit.
