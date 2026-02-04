# Portability Debt Tracker

Track any platform-specific dependencies or coupling that needs to be addressed.

## Current Status: ✅ Portable

The application is currently portable and can be deployed to any container-based or PaaS hosting platform.

---

## Active Debt Items

| Date | Category | Description | Severity | Status |
|------|----------|-------------|----------|--------|
| - | - | No active debt items | - | - |

---

## Resolved Items

| Date Resolved | Category | Description | Resolution |
|---------------|----------|-------------|------------|
| 2024-01-26 | Config | No `.env.example` file | Created `.env.example` with all required vars |
| 2024-01-26 | Docker | No Dockerfile | Created multi-stage production Dockerfile |
| 2024-01-26 | Reliability | No graceful shutdown | Added SIGTERM handling |
| 2024-01-26 | Config | No startup env validation | Added fail-fast validation |
| 2024-01-26 | CI | No CI pipeline | Added GitHub Actions workflow |

---

## Categories

- **Config**: Environment variables, secrets, configuration files
- **Docker**: Container-related issues
- **Database**: Database coupling or migration issues
- **Storage**: File storage dependencies
- **Auth**: Authentication platform coupling
- **Scheduler**: Background job platform dependencies
- **Reliability**: Graceful shutdown, health checks
- **CI**: Continuous integration issues

---

## Severity Levels

- **Critical**: Blocks deployment to other platforms
- **High**: Requires significant workaround
- **Medium**: Inconvenient but has workaround
- **Low**: Minor issue, cosmetic

---

## How to Add New Debt

When discovering new platform coupling:

1. Add a row to the "Active Debt Items" table
2. Include the date, category, description, and severity
3. Create an issue in the issue tracker if significant
4. Move to "Resolved Items" when fixed

---

## Quarterly Review Checklist

Every quarter, validate:

- [ ] `make dev` works from a fresh clone
- [ ] `make docker-build` succeeds
- [ ] `docker run` starts and serves requests
- [ ] Deployment guide is up to date
- [ ] No new platform coupling introduced
