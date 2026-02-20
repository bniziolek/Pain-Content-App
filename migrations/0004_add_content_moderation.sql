-- Migration: Add content moderation fields
-- Created for Issue #64 - Content moderation queue and approval workflow

-- Add moderation fields to content_items table
ALTER TABLE "content_items" ADD COLUMN IF NOT EXISTS "clinician_user_id" VARCHAR REFERENCES "users"("id");
ALTER TABLE "content_items" ADD COLUMN IF NOT EXISTS "moderation_status" TEXT NOT NULL DEFAULT 'approved';
ALTER TABLE "content_items" ADD COLUMN IF NOT EXISTS "moderation_note" TEXT;
ALTER TABLE "content_items" ADD COLUMN IF NOT EXISTS "submitted_at" TIMESTAMP;

-- Create index on moderation_status for faster queue queries
CREATE INDEX IF NOT EXISTS "content_items_moderation_status_idx" ON "content_items" ("moderation_status");

-- Create index on submitted_at for ordering the moderation queue
CREATE INDEX IF NOT EXISTS "content_items_submitted_at_idx" ON "content_items" ("submitted_at");

-- Create index on clinician_user_id for finding content by author
CREATE INDEX IF NOT EXISTS "content_items_clinician_user_id_idx" ON "content_items" ("clinician_user_id");
