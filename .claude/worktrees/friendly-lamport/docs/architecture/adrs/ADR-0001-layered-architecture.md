# ADR-0001-layered-architecture

## Status

Accepted

## Context

The backend previously mixed routing, business logic, and infrastructure calls in the same files. This made changes risky and hard to reason about.

## Decision

Adopt a layered architecture with the following responsibilities:

- **Routes**: HTTP handling and validation
- **Application Services**: orchestration of use-cases
- **Domain Services**: pure business logic
- **Infrastructure**: external APIs (email, Stripe, CMS)
- **Storage**: database access

See `docs/architecture/ARCHITECTURE.md` for rules.

## Consequences

- Code becomes easier to understand and test.
- External integrations are isolated and swappable.
- Changes require touching fewer layers, but structure must be followed.
