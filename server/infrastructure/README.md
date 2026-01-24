# Infrastructure Layer

This folder contains integrations with external systems (email providers, Stripe, CMS, audit, etc.).

## Role in the Architecture

- Wraps third-party APIs behind a clean interface.
- Handles configuration, retries, and error translation.
- Keeps external details out of application and domain logic.

If a vendor changes, updates should mostly stay here.
