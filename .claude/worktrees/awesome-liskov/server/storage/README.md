# Storage Layer (Database)

This folder contains database-specific queries and helpers. The main storage interface lives in `server/storage.ts`.

## Role in the Architecture

- Encapsulates database access (tables, queries, transactions).
- Returns typed data for use in application services.
- Keeps SQL/ORM details out of higher layers.
