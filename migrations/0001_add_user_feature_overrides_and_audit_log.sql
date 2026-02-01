-- Migration: Add user feature overrides and audit log tables
-- Created for PR addressing issue #60 review comments

-- Create user_feature_overrides table
CREATE TABLE IF NOT EXISTS "user_feature_overrides" (
  "id" VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" VARCHAR NOT NULL,
  "feature_flag_id" VARCHAR NOT NULL,
  "is_enabled" BOOLEAN NOT NULL,
  "set_by_admin_id" VARCHAR,
  "reason" TEXT,
  "created_at" TIMESTAMP DEFAULT now() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT now() NOT NULL,
  CONSTRAINT "user_feature_overrides_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id"),
  CONSTRAINT "user_feature_overrides_feature_flag_id_fkey" FOREIGN KEY ("feature_flag_id") REFERENCES "feature_flags"("id"),
  CONSTRAINT "user_feature_overrides_set_by_admin_id_fkey" FOREIGN KEY ("set_by_admin_id") REFERENCES "users"("id")
);

-- Create unique index to prevent duplicate overrides for the same user and feature flag
CREATE UNIQUE INDEX IF NOT EXISTS "user_feature_override_unique_idx" ON "user_feature_overrides" ("user_id", "feature_flag_id");

-- Create feature_flag_audit_log table
CREATE TABLE IF NOT EXISTS "feature_flag_audit_log" (
  "id" VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" VARCHAR NOT NULL,
  "feature_flag_id" VARCHAR NOT NULL,
  "admin_id" VARCHAR NOT NULL,
  "action" TEXT NOT NULL,
  "previous_value" BOOLEAN,
  "new_value" BOOLEAN,
  "reason" TEXT,
  "created_at" TIMESTAMP DEFAULT now() NOT NULL,
  CONSTRAINT "feature_flag_audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id"),
  CONSTRAINT "feature_flag_audit_log_feature_flag_id_fkey" FOREIGN KEY ("feature_flag_id") REFERENCES "feature_flags"("id"),
  CONSTRAINT "feature_flag_audit_log_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id")
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS "feature_flag_audit_log_user_id_idx" ON "feature_flag_audit_log" ("user_id");

-- Create index on feature_flag_id for faster lookups
CREATE INDEX IF NOT EXISTS "feature_flag_audit_log_feature_flag_id_idx" ON "feature_flag_audit_log" ("feature_flag_id");

-- Create index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS "feature_flag_audit_log_created_at_idx" ON "feature_flag_audit_log" ("created_at" DESC);
