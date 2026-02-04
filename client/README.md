# Client (Frontend)

This folder contains the user interface that runs in the browser.

## Role in the Architecture

- Presents screens and UI components.
- Calls API endpoints in `server/routes/`.
- Uses shared types from `shared/` when available.

If you want to follow a feature end-to-end, start with the UI action here and trace the API call into the server.
