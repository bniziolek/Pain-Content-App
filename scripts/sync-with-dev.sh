#!/bin/bash

# =============================================================================
# sync-with-dev.sh
# Syncs your current feature branch with the latest dev branch
# Update DEV_BRANCH below every two weeks when you merge into main
# =============================================================================

DEV_BRANCH="dev"

# Get current branch name
CURRENT_BRANCH=$(git branch --show-current)

# Don't run if we're on the dev branch
if [ "$CURRENT_BRANCH" = "$DEV_BRANCH" ]; then
  echo "Error: You're already on the $DEV_BRANCH branch. Switch to a feature branch first."
  exit 1
fi

echo "========================================"
echo "Syncing $CURRENT_BRANCH with $DEV_BRANCH"
echo "========================================"

# Fetch latest from remote
echo "Fetching latest from remote..."
git fetch origin

# Pull latest dev branch
echo "Pulling latest $DEV_BRANCH..."
git checkout $DEV_BRANCH
git pull origin $DEV_BRANCH

# Switch back to feature branch and merge dev into it
echo "Merging $DEV_BRANCH into $CURRENT_BRANCH..."
git checkout $CURRENT_BRANCH
git merge $DEV_BRANCH

# Check if merge was successful
if [ $? -ne 0 ]; then
  echo "========================================"
  echo "Merge conflict detected!"
  echo "Resolve conflicts, then run:"
  echo "  git add ."
  echo "  git commit"
  echo "  git push origin $CURRENT_BRANCH"
  echo "========================================"
  exit 1
fi

# Push feature branch to remote
echo "Pushing $CURRENT_BRANCH to remote..."
git push origin $CURRENT_BRANCH

echo "========================================"
echo "Done! $CURRENT_BRANCH is synced with $DEV_BRANCH"
echo "You can now create your PR on GitHub."
echo "========================================"
