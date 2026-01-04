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

## Tips

- Always commit your changes before switching branches
- Pull latest changes before creating new branches
- Keep feature branches focused on one thing
- Delete feature branches after merging (keeps things clean)
