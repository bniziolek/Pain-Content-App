-- Add lockout fields to users table for account security
-- This migration adds locked_until and permanently_locked columns
-- to align with the PublicUser API type

ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until timestamp;
ALTER TABLE users ADD COLUMN IF NOT EXISTS permanently_locked boolean DEFAULT false;
