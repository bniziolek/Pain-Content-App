# Webhooks Application Services

Processes external events (e.g., Stripe) and translates them into internal actions.

## Role in the Architecture

- Called by `server/routes/webhooks.ts`.
- Uses storage and application services to update state.

