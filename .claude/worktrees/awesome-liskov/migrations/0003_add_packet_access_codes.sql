-- Migration: Add packet_access_codes table
-- Created for PR addressing issue #39 - Quick lookup access code system

-- Create packet_access_codes table
CREATE TABLE IF NOT EXISTS "packet_access_codes" (
  "id" VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" VARCHAR(10) NOT NULL UNIQUE,
  "internal_screening_id" VARCHAR,
  "clinician_id" VARCHAR NOT NULL,
  "content_ids" TEXT[] NOT NULL,
  "access_count" INTEGER DEFAULT 0,
  "last_accessed_at" TIMESTAMP,
  "expires_at" TIMESTAMP NOT NULL,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP DEFAULT now() NOT NULL,
  CONSTRAINT "packet_access_codes_internal_screening_id_fkey" FOREIGN KEY ("internal_screening_id") REFERENCES "internal_screenings"("id"),
  CONSTRAINT "packet_access_codes_clinician_id_fkey" FOREIGN KEY ("clinician_id") REFERENCES "users"("id")
);

-- Create unique index on code for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS "packet_access_codes_code_idx" ON "packet_access_codes" ("code");

-- Create index on clinician_id for fast lookups by clinician
CREATE INDEX IF NOT EXISTS "packet_access_codes_clinician_id_idx" ON "packet_access_codes" ("clinician_id");

-- Create index on expires_at for cleanup and validation
CREATE INDEX IF NOT EXISTS "packet_access_codes_expires_at_idx" ON "packet_access_codes" ("expires_at");

-- Create index on is_active for filtering active codes
CREATE INDEX IF NOT EXISTS "packet_access_codes_is_active_idx" ON "packet_access_codes" ("is_active");
