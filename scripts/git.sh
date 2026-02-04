#!/bin/bash

# =============================================================================
# git.sh - Simple git helper menu
# Usage: ./scripts/git.sh
# =============================================================================

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "========================================"
echo "  Git Helper"
echo "========================================"
echo ""
echo "  1) Sync current branch with dev"
echo "  2) Cleanup stale branches"
echo "  q) Quit"
echo ""
read -p "Choose an option: " choice

case $choice in
  1)
    "$SCRIPT_DIR/sync-with-dev.sh"
    ;;
  2)
    "$SCRIPT_DIR/cleanup-branches.sh"
    ;;
  q|Q)
    echo "Goodbye!"
    exit 0
    ;;
  *)
    echo "Invalid option"
    exit 1
    ;;
esac
