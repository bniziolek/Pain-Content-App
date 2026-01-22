# Architecture Guide Index

This directory is the single source of truth for how to evolve the codebase under the layered architecture.

## Core Architecture

- `ARCHITECTURE.md`: Layer definitions, responsibilities, and import rules.
- `ARCHITECTURE_MAP.md`: Non-technical overview and feature tours.
- `ARCHITECTURE_MIGRATION_TASKS.md`: Concrete migration tasks to reach the target architecture.

## Supporting Guides (Copies)

These files are copied here for convenience so agents can work from a single directory.

- `DEVELOPMENT_WORKFLOW.md`: Standard development workflow and expectations.
- `STYLE_GUIDE.md`: Naming, formatting, and code conventions.
- `database-schema.md`: Data model reference for storage interfaces.
- `api-reference.md`: API contracts and route expectations.
- `INTEGRATIONS.md`: External integrations and configuration details.

## Usage Notes

- Routes should be thin: validate input, call application services, return response.
- Application services orchestrate workflows and coordinate domain, storage, and infrastructure.
- Domain services remain pure and free of IO.
- Infrastructure services wrap external APIs and hide provider details.
- Storage access is centralized in `IStorage` and `DatabaseStorage`.
