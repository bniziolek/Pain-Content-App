# Background Jobs Application Services

Defines long-running or scheduled jobs, such as cleanups or syncs.

## Role in the Architecture

- Invoked by `server/background-jobs.ts`.
- Runs outside the request/response flow.
- Uses storage and infrastructure services.
