-- Migration: Fix foreign key ON DELETE strategies for all references to users.id
-- Without an explicit ON DELETE strategy, FK constraints default to RESTRICT,
-- which causes user deletion to fail with a FK violation when the user has related records.
--
-- Nullable FK columns use SET NULL (preserve the row, orphan it).
-- NOT NULL FK columns use CASCADE (delete child rows with the parent).

-- Helper: drop and re-add each FK with the correct ON DELETE rule.
-- PostgreSQL auto-generates constraint names as {table}_{column}_fkey.

-- password_reset_tokens.user_id → CASCADE
ALTER TABLE password_reset_tokens DROP CONSTRAINT IF EXISTS password_reset_tokens_user_id_fkey;
ALTER TABLE password_reset_tokens ADD CONSTRAINT password_reset_tokens_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- user_email_connections.user_id → CASCADE
ALTER TABLE user_email_connections DROP CONSTRAINT IF EXISTS user_email_connections_user_id_fkey;
ALTER TABLE user_email_connections ADD CONSTRAINT user_email_connections_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- content_items.clinician_user_id → SET NULL (nullable; system content survives clinician deletion)
ALTER TABLE content_items DROP CONSTRAINT IF EXISTS content_items_clinician_user_id_fkey;
ALTER TABLE content_items ADD CONSTRAINT content_items_clinician_user_id_fkey
  FOREIGN KEY (clinician_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- assessments.clinician_user_id → SET NULL (nullable; system assessments survive)
ALTER TABLE assessments DROP CONSTRAINT IF EXISTS assessments_clinician_user_id_fkey;
ALTER TABLE assessments ADD CONSTRAINT assessments_clinician_user_id_fkey
  FOREIGN KEY (clinician_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- assessment_invites.clinician_user_id → CASCADE
ALTER TABLE assessment_invites DROP CONSTRAINT IF EXISTS assessment_invites_clinician_user_id_fkey;
ALTER TABLE assessment_invites ADD CONSTRAINT assessment_invites_clinician_user_id_fkey
  FOREIGN KEY (clinician_user_id) REFERENCES users(id) ON DELETE CASCADE;

-- internal_screenings.clinician_user_id → CASCADE
ALTER TABLE internal_screenings DROP CONSTRAINT IF EXISTS internal_screenings_clinician_user_id_fkey;
ALTER TABLE internal_screenings ADD CONSTRAINT internal_screenings_clinician_user_id_fkey
  FOREIGN KEY (clinician_user_id) REFERENCES users(id) ON DELETE CASCADE;

-- email_logs.clinician_user_id → CASCADE
ALTER TABLE email_logs DROP CONSTRAINT IF EXISTS email_logs_clinician_user_id_fkey;
ALTER TABLE email_logs ADD CONSTRAINT email_logs_clinician_user_id_fkey
  FOREIGN KEY (clinician_user_id) REFERENCES users(id) ON DELETE CASCADE;

-- follow_up_rules.clinician_user_id → SET NULL (nullable; system templates survive)
ALTER TABLE follow_up_rules DROP CONSTRAINT IF EXISTS follow_up_rules_clinician_user_id_fkey;
ALTER TABLE follow_up_rules ADD CONSTRAINT follow_up_rules_clinician_user_id_fkey
  FOREIGN KEY (clinician_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- user_template_preferences.user_id → CASCADE
ALTER TABLE user_template_preferences DROP CONSTRAINT IF EXISTS user_template_preferences_user_id_fkey;
ALTER TABLE user_template_preferences ADD CONSTRAINT user_template_preferences_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- care_pathways.clinician_user_id → SET NULL (nullable; system pathways survive)
ALTER TABLE care_pathways DROP CONSTRAINT IF EXISTS care_pathways_clinician_user_id_fkey;
ALTER TABLE care_pathways ADD CONSTRAINT care_pathways_clinician_user_id_fkey
  FOREIGN KEY (clinician_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- patient_pathways.clinician_user_id → CASCADE
ALTER TABLE patient_pathways DROP CONSTRAINT IF EXISTS patient_pathways_clinician_user_id_fkey;
ALTER TABLE patient_pathways ADD CONSTRAINT patient_pathways_clinician_user_id_fkey
  FOREIGN KEY (clinician_user_id) REFERENCES users(id) ON DELETE CASCADE;

-- recommendation_configs.clinician_user_id → SET NULL (nullable; system rules survive)
ALTER TABLE recommendation_configs DROP CONSTRAINT IF EXISTS recommendation_configs_clinician_user_id_fkey;
ALTER TABLE recommendation_configs ADD CONSTRAINT recommendation_configs_clinician_user_id_fkey
  FOREIGN KEY (clinician_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- patient_recommendations.clinician_user_id → CASCADE
ALTER TABLE patient_recommendations DROP CONSTRAINT IF EXISTS patient_recommendations_clinician_user_id_fkey;
ALTER TABLE patient_recommendations ADD CONSTRAINT patient_recommendations_clinician_user_id_fkey
  FOREIGN KEY (clinician_user_id) REFERENCES users(id) ON DELETE CASCADE;

-- audit_logs.user_id → SET NULL (nullable; preserve audit trail, orphan the user reference)
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;
ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- user_permissions.user_id → CASCADE
ALTER TABLE user_permissions DROP CONSTRAINT IF EXISTS user_permissions_user_id_fkey;
ALTER TABLE user_permissions ADD CONSTRAINT user_permissions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- user_permissions.granted_by → SET NULL (nullable: preserve permission records when granting admin is deleted)
ALTER TABLE user_permissions ALTER COLUMN granted_by DROP NOT NULL;
ALTER TABLE user_permissions DROP CONSTRAINT IF EXISTS user_permissions_granted_by_fkey;
ALTER TABLE user_permissions ADD CONSTRAINT user_permissions_granted_by_fkey
  FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL;

-- persona_switches.user_id → CASCADE
ALTER TABLE persona_switches DROP CONSTRAINT IF EXISTS persona_switches_user_id_fkey;
ALTER TABLE persona_switches ADD CONSTRAINT persona_switches_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- data_inventory.reviewed_by → SET NULL (nullable)
ALTER TABLE data_inventory DROP CONSTRAINT IF EXISTS data_inventory_reviewed_by_fkey;
ALTER TABLE data_inventory ADD CONSTRAINT data_inventory_reviewed_by_fkey
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL;

-- admin_notes.user_id → CASCADE
ALTER TABLE admin_notes DROP CONSTRAINT IF EXISTS admin_notes_user_id_fkey;
ALTER TABLE admin_notes ADD CONSTRAINT admin_notes_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- admin_notes.admin_id → SET NULL (nullable: preserve notes when admin is deleted for compliance)
ALTER TABLE admin_notes ALTER COLUMN admin_id DROP NOT NULL;
ALTER TABLE admin_notes DROP CONSTRAINT IF EXISTS admin_notes_admin_id_fkey;
ALTER TABLE admin_notes ADD CONSTRAINT admin_notes_admin_id_fkey
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL;

-- login_history.user_id → CASCADE
ALTER TABLE login_history DROP CONSTRAINT IF EXISTS login_history_user_id_fkey;
ALTER TABLE login_history ADD CONSTRAINT login_history_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- user_feature_overrides.user_id → CASCADE
ALTER TABLE user_feature_overrides DROP CONSTRAINT IF EXISTS user_feature_overrides_user_id_fkey;
ALTER TABLE user_feature_overrides ADD CONSTRAINT user_feature_overrides_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- user_feature_overrides.set_by_admin_id → SET NULL (nullable)
ALTER TABLE user_feature_overrides DROP CONSTRAINT IF EXISTS user_feature_overrides_set_by_admin_id_fkey;
ALTER TABLE user_feature_overrides ADD CONSTRAINT user_feature_overrides_set_by_admin_id_fkey
  FOREIGN KEY (set_by_admin_id) REFERENCES users(id) ON DELETE SET NULL;

-- feature_flag_audit_log.user_id → CASCADE
ALTER TABLE feature_flag_audit_log DROP CONSTRAINT IF EXISTS feature_flag_audit_log_user_id_fkey;
ALTER TABLE feature_flag_audit_log ADD CONSTRAINT feature_flag_audit_log_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- feature_flag_audit_log.admin_id → SET NULL (nullable: preserve audit log when admin is deleted)
ALTER TABLE feature_flag_audit_log ALTER COLUMN admin_id DROP NOT NULL;
ALTER TABLE feature_flag_audit_log DROP CONSTRAINT IF EXISTS feature_flag_audit_log_admin_id_fkey;
ALTER TABLE feature_flag_audit_log ADD CONSTRAINT feature_flag_audit_log_admin_id_fkey
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL;

-- user_favorites.user_id → CASCADE
ALTER TABLE user_favorites DROP CONSTRAINT IF EXISTS user_favorites_user_id_fkey;
ALTER TABLE user_favorites ADD CONSTRAINT user_favorites_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- content_collections.user_id → CASCADE
ALTER TABLE content_collections DROP CONSTRAINT IF EXISTS content_collections_user_id_fkey;
ALTER TABLE content_collections ADD CONSTRAINT content_collections_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- clinic_branding.user_id → CASCADE
ALTER TABLE clinic_branding DROP CONSTRAINT IF EXISTS clinic_branding_user_id_fkey;
ALTER TABLE clinic_branding ADD CONSTRAINT clinic_branding_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- packet_access_codes.clinician_id → CASCADE
ALTER TABLE packet_access_codes DROP CONSTRAINT IF EXISTS packet_access_codes_clinician_id_fkey;
ALTER TABLE packet_access_codes ADD CONSTRAINT packet_access_codes_clinician_id_fkey
  FOREIGN KEY (clinician_id) REFERENCES users(id) ON DELETE CASCADE;
