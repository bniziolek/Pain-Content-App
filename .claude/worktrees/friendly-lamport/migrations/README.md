# Database Migrations

This directory contains SQL migration files for the Pain Content App database.

## Running Migrations

### Manual Execution

To run migrations manually against your database:

```bash
# Connect to your PostgreSQL database
psql $DATABASE_URL

# Run the migration file
\i migrations/0001_add_user_feature_overrides_and_audit_log.sql
```

### Using Drizzle Kit

If you have DATABASE_URL configured, you can use Drizzle Kit:

```bash
# Generate migrations from schema changes
npx drizzle-kit generate

# Push schema changes directly to database (development only)
npm run db:push
```

## Migration Files

- **0001_add_user_feature_overrides_and_audit_log.sql** - Adds tables for user-level feature flag overrides and their audit trail. Required for the User Support Dashboard feature (issue #60).

## Notes

- Migrations are written to be idempotent (can be run multiple times safely) using `IF NOT EXISTS` clauses
- Always test migrations in a development environment before applying to production
- Keep migrations in sequential order with numbered prefixes
