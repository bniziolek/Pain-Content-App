# Routes Layer

This folder contains HTTP endpoints. Each file maps to a domain area (assessments, messaging, subscriptions, etc.).

## Role in the Architecture

- Acts as the API layer.
- Validates incoming requests and authentication.
- Calls application services to do the real work.
- Formats the response back to the client.

## How to Read

1. Find the endpoint in a route file.
2. Follow its call into `server/application/` for the use-case.
