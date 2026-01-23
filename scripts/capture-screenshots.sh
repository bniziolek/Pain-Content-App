#!/bin/bash

set -euo pipefail

PORT=${PORT:-5000}
BASE_URL=${PW_BASE_URL:-http://localhost:$PORT}

cleanup() {
  if [[ -n "${SERVER_PID:-}" ]]; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

echo "Starting dev server on $BASE_URL..."
NODE_ENV=development PORT="$PORT" node --import tsx/esm server/index.ts &
SERVER_PID=$!

for i in {1..30}; do
  if curl -sf "$BASE_URL/api/health" >/dev/null; then
    echo "Server is up. Running screenshot capture..."
    PW_SKIP_WEB_SERVER=1 PW_BASE_URL="$BASE_URL" \
      npx playwright test tests/e2e/capture-screenshots.spec.ts --reporter=list
    echo "Screenshots captured in docs/assets/screenshots/"
    exit 0
  fi
  sleep 1
  echo "Waiting for server... ($i/30)"
done

echo "Server did not start in time."
exit 1
