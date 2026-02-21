# Assessment Invites Application Services

Handles invite-based assessment flows (tokens, public access, and result retrieval).

## Role in the Architecture

- Called by `server/routes/assessment-invites.ts`.
- Coordinates storage, scoring, and recommendation generation.
- Supports patient-friendly access without full authentication.
