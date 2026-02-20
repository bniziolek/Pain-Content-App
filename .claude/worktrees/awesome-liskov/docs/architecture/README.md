# Architecture Guide Index

This directory is the single source of truth for how to evolve the codebase under the layered architecture.

## Core Architecture

- `ARCHITECTURE.md`: Layer definitions, responsibilities, and import rules.
- `ARCHITECTURE_MAP.md`: Non-technical overview and feature tours.
- `ARCHITECTURE_MIGRATION_TASKS.md`: Concrete migration tasks to reach the target architecture.
- `adrs/README.md`: Architecture Decision Records index.

## Related Guides

- `docs/developer/DEVELOPMENT_WORKFLOW.md`: Standard development workflow and expectations.
- `docs/developer/STYLE_GUIDE.md`: Naming, formatting, and code conventions.
- `docs/data/database-schema.md`: Data model reference for storage interfaces.
- `docs/api/api-reference.md`: API contracts and route expectations.
- `docs/data/INTEGRATIONS.md`: External integrations and configuration details.

## Usage Notes

- Routes should be thin: validate input, call application services, return response.
- Application services orchestrate workflows and coordinate domain, storage, and infrastructure.
- Domain services remain pure and free of IO.
- Infrastructure services wrap external APIs and hide provider details.
- Storage access is centralized in `IStorage` and `DatabaseStorage`.
