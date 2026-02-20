# Assessments Application Services

Creates, scores, updates, and lists assessments and internal screenings.

## Role in the Architecture

- Called by `server/routes/assessments.ts`.
- Uses scoring domain logic and storage.
- Returns structured results for the UI.
