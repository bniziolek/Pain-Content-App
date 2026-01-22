# Server Layer Overview

This folder contains the backend code. It follows a layered architecture so each part has a clear job and is easier to change safely.

## Main Responsibilities

- **Routes** (`server/routes/`): HTTP endpoints and input validation.
- **Application Services** (`server/application/`): orchestrate use-cases and coordinate work.
- **Domain Services** (`server/domain/`): core business rules and algorithms.
- **Infrastructure** (`server/infrastructure/`): external systems (email, Stripe, CMS, audit).
- **Storage** (`server/storage.ts`, `server/storage/`): database access and queries.

## Key Entry Points

- `server/index.ts`: server startup and registration.
- `server/routes/index.ts`: connects all route files.
- `server/application/context.ts`: shared interfaces used by services.

If you are new, start with the Architecture Map in `docs/architecture/ARCHITECTURE_MAP.md`.
