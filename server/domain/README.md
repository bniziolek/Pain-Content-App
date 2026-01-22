# Domain Services Layer

This folder contains core business rules and algorithms. It aims to be as independent as possible from the database, HTTP, or external services.

## Role in the Architecture

- Encapsulates business logic and calculations.
- Accepts plain inputs and returns plain outputs.
- Avoids side effects when possible.

If a rule changes, it should usually be updated here.
