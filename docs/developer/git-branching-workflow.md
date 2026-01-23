# Git Branching Workflow Reference

## Branch Structure

```
main (production)
  └── dev (weekly development branch)
        ├── feature/feature-name-1
        ├── feature/feature-name-2
        └── feature/feature-name-3
```

## Workflow Overview

1. **Weekly dev branch** - All active development happens here
2. **Feature branches** - Created from dev for specific features
3. **Weekly merge to main** - Dev gets merged into main at the end of each week

## Creating Branches

### In the Git Pane (Visual)

1. Open the **Git** pane in Tools
2. Click the **branch dropdown** (shows current branch name)
3. Select **"Create branch"**
4. Enter your branch name

### Via Shell Commands

```bash
# Create and switch to dev branch
git checkout -b dev

# Create a feature branch from dev
git checkout dev
git checkout -b feature/your-feature-name

# Switch between branches
git checkout main
git checkout dev
git checkout feature/your-feature-name
```

## Merging Branches

### Feature → Dev (when feature is complete)

```bash
git checkout dev
git merge feature/your-feature-name
```

### Dev → Main (weekly)

```bash
git checkout main
git merge dev
```

### In the Git Pane

1. Switch to the branch you want to merge INTO
2. Use the merge option
3. Select the branch you want to merge FROM

## Naming Conventions

- **Dev branches**: `dev` or `dev-week-01`, `dev-week-02`, etc.
- **Feature branches**: `feature/description` (e.g., `feature/recommendation-engine`)
- **Bugfix branches**: `bugfix/description` (e.g., `bugfix/login-error`)

## Weekly Workflow Example

**Monday:**
- Create `dev-week-05` from `main`
- Start feature work on `feature/new-assessment-type`

**During the week:**
- Commit to feature branches
- Merge completed features into dev
- Test on dev branch

**Friday/End of week:**
- Merge `dev-week-05` into `main`
- Create `dev-week-06` for next week

## Documenting Your Merge

Before merging a branch, it's important to document what was accomplished. This creates a permanent record of the changes for future reference.

### Reviewing Branch Changes Before Merge

Before merging, review what was done in the branch:

```bash
# See all commits in the branch (compared to dev)
git log dev..feature/your-feature-name --oneline

# See detailed changes
git log dev..feature/your-feature-name

# See files that were changed
git diff --stat dev..feature/your-feature-name

# See the actual code changes
git diff dev..feature/your-feature-name
```

### Writing Descriptive Merge Commits

Always use `--no-ff` (no fast-forward) to create a merge commit, even if the branch could be fast-forwarded. This ensures you have a record of the merge:

```bash
git checkout dev
git merge --no-ff feature/your-feature-name -m "Merge: Add interactive product tour

Summary:
- Created TourProvider component with step highlighting
- Added first-login tour trigger on dashboard
- Added 'Help & Tips' tab in settings with replay button
- Updated auth flow to go directly to dashboard

Files changed: 6
Closes: #123"
```

### Merge Message Template

Use this template for merge commits:

```
Merge: [Brief description of what was added/changed]

Summary:
- [Main change 1]
- [Main change 2]
- [Main change 3]

Technical notes:
- [Any important technical details]
- [Breaking changes if any]

Related: [Issue numbers, ticket IDs, or references]
```

### Example Merge Messages

**Feature merge:**
```
Merge: Implement recommendation engine

Summary:
- Added scoring service for assessment responses
- Created three-tier recommendation logic
- Built recommendation rules management UI
- Added patient recommendations tracking

Technical notes:
- New tables: recommendation_configs, patient_recommendations
- Requires running migrations before deploy
```

**Bugfix merge:**
```
Merge: Fix patient portal authentication

Summary:
- Fixed access code validation timing issue
- Added rate limiting for failed attempts
- Improved error messages for users

Technical notes:
- No database changes required
```

### Where Merge Messages Are Stored

Your merge commit messages are stored in several places:

**In Git (local and remote):**
- The message is part of the merge commit itself
- Visible with `git log` or `git show <commit-hash>`
- Pushed to GitHub when you push the branch

**In GitHub:**
- **Commits tab**: Click on any repository → "Commits" to see all commits including merges
- **Commit detail page**: Click any commit hash to see the full message
- **Branch history**: When viewing a branch, you see all commits that led to it
- **Network graph**: Repository → Insights → Network shows visual branch/merge history
- **Blame view**: On any file, click "Blame" to see which commit changed each line

**Finding merge messages on GitHub:**
1. Go to your repository on GitHub
2. Click "Commits" (or the commit count like "245 commits")
3. Look for commits that start with "Merge:" - these are your merge commits
4. Click on the commit hash to see the full message

### Viewing Merge History

To see past merges and what they contained:

```bash
# See all merge commits
git log --merges --oneline

# See details of a specific merge
git show <merge-commit-hash>

# See what was merged in a specific commit
git log <merge-commit-hash>^..<merge-commit-hash> --oneline
```

## Cleaning Up Old Branches

After merging, delete old branches to keep your repository clean and organized.

### Deleting Local Branches

```bash
# Delete a single branch (safe - won't delete if not merged)
git branch -d feature/your-feature-name

# Force delete (use carefully - deletes even if not merged)
git branch -D feature/your-feature-name

# List all local branches
git branch

# Delete multiple branches at once
git branch -d feature/feature-1 feature/feature-2 bugfix/old-fix
```

### Deleting Remote Branches (on GitHub)

```bash
# Delete a remote branch
git push origin --delete feature/your-feature-name

# Alternative syntax
git push origin :feature/your-feature-name
```

### Cleaning Up After Merge

Best practice workflow after merging:

```bash
# 1. Merge your feature branch into dev
git checkout dev
git merge --no-ff feature/my-feature -m "Merge: Description..."

# 2. Push the merge to remote
git push origin dev

# 3. Delete the local branch
git branch -d feature/my-feature

# 4. Delete the remote branch
git push origin --delete feature/my-feature
```

### Bulk Cleanup Commands

```bash
# See which branches are already merged into current branch
git branch --merged

# Delete all local branches that have been merged (except main/dev)
git branch --merged | grep -v "main\|dev\|master" | xargs git branch -d

# Prune remote-tracking branches that no longer exist on remote
git fetch --prune

# See stale remote-tracking branches
git remote prune origin --dry-run
```

### Deleting Branches on GitHub (Web Interface)

1. Go to your repository on GitHub
2. Click **"Branches"** (next to the branch dropdown, or under Code tab)
3. Find the branch you want to delete
4. Click the **trash icon** next to the branch name
5. Confirm deletion

**After a Pull Request merge**, GitHub shows a "Delete branch" button - use it!

### Weekly Cleanup Routine

At the end of each week (after merging dev to main):

1. **Review branches**: `git branch -a` (shows local and remote)
2. **Delete merged feature branches**: `git branch -d feature/...`
3. **Clean remote branches**: `git push origin --delete feature/...`
4. **Prune stale references**: `git fetch --prune`
5. **Verify cleanup**: `git branch -a` (should only show main, dev, and active branches)

## Tips

- Always commit your changes before switching branches
- Pull latest changes before creating new branches
- Keep feature branches focused on one thing
- Delete feature branches after merging (keeps things clean)
- **Always use `--no-ff` when merging to preserve branch history**
- **Write detailed merge messages to document what was accomplished**
