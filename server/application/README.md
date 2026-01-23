# Application Services Layer

This folder contains the "use-case" logic. These services coordinate business rules, database actions, and external integrations.

## Role in the Architecture

- Orchestrates workflows (multi-step operations).
- Calls domain services for business rules.
- Calls storage and infrastructure for data and external APIs.
- Returns clean results to the routes.

## How to Read

Start with a route and follow it here. Each subfolder corresponds to a feature area (e.g., assessments, messaging, subscriptions).
