#!/bin/bash

# =============================================================================
# cleanup-branches.sh - Remove stale local branches that have been deleted remotely
# Usage: ./scripts/cleanup-branches.sh
# =============================================================================

echo ""
echo "========================================"
echo "  Cleanup Stale Branches"
echo "========================================"
echo ""

# Fetch and prune remote tracking references
echo "Fetching from remote and pruning..."
git fetch --prune

# Find local branches whose upstream is gone
STALE_BRANCHES=$(git branch -vv | grep ': gone]' | awk '{print $1}' | sed 's/^\*//')

if [ -z "$STALE_BRANCHES" ]; then
    echo ""
    echo "No stale branches found. You're all clean!"
    echo ""
    exit 0
fi

echo ""
echo "Found stale branches (remote deleted):"
echo "$STALE_BRANCHES" | while read branch; do
    echo "  - $branch"
done
echo ""

read -p "Delete these branches? (y/n): " confirm

if [[ "$confirm" == "y" || "$confirm" == "Y" ]]; then
    echo ""
    echo "$STALE_BRANCHES" | while read branch; do
        if [ -n "$branch" ]; then
            echo "Deleting: $branch"
            git branch -D "$branch"
        fi
    done
    echo ""
    echo "Cleanup complete!"
else
    echo ""
    echo "Cancelled. No branches deleted."
fi
echo ""
