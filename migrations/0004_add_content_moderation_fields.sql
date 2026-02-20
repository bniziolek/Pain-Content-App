-- Migration: Add content moderation fields (Issue #64)
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS "clinician_user_id" VARCHAR REFERENCES users(id);
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS "moderation_status" TEXT NOT NULL DEFAULT 'approved';
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS "moderation_note" TEXT;
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS "submitted_at" TIMESTAMP;
