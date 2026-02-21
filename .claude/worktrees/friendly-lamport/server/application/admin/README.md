# Admin Application Services

These services handle administrative workflows like user management, analytics, and operational tasks.

## Role in the Architecture

- Called by admin routes in `server/routes/admin.ts`.
- Orchestrates storage reads/writes and audit logging.
- Does not implement UI; it returns data for the admin UI.
