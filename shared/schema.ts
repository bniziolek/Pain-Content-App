import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - clinicians who subscribe to the platform
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  role: text("role").notNull().default("clinician"), // 'clinician' | 'admin' | 'super_admin'
  
  // Subscription fields
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status").default("inactive"), // 'active' | 'inactive' | 'past_due' | 'canceled'
  subscriptionPeriodEnd: timestamp("subscription_period_end"),
  subscriptionTier: text("subscription_tier").default("basic"), // 'free' | 'basic' | 'pro' | 'enterprise'
  
  lastLogin: timestamp("last_login"),
  
  // Onboarding tracking
  onboardingCompleted: boolean("onboarding_completed").default(false),
  onboardingStep: integer("onboarding_step").default(0), // Current step if abandoned mid-flow
  
  // Email delivery preference
  emailDeliveryMode: text("email_delivery_mode").default("central"), // 'central' | 'personal'
  
  // Persona switching for super admins
  activePersona: text("active_persona"), // When super admin is viewing as another role, stores the persona
  
  // Clinician demographic/profile information
  phone: text("phone"),
  clinicName: text("clinic_name"),
  credentials: text("credentials"), // e.g., DPT, PT, OT, MD, etc.
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Password reset tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User email connections - stores OAuth tokens for personal Gmail
export const userEmailConnections = pgTable("user_email_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  provider: text("provider").notNull().default("gmail"), // 'gmail' for now
  email: text("email").notNull(), // The connected email address
  accessToken: text("access_token").notNull(), // Encrypted
  refreshToken: text("refresh_token"), // Encrypted
  expiresAt: timestamp("expires_at"),
  scopes: text("scopes").array(),
  status: text("status").notNull().default("active"), // 'active' | 'error' | 'expired' | 'revoked'
  lastError: text("last_error"),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Content library - educational modules
export const contentItems = pgTable("content_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  body: text("body").notNull(), // markdown content
  tags: text("tags").array().notNull().default(sql`ARRAY[]::text[]`),
  imageUrl: text("image_url"),
  readTime: text("read_time").default("5 min"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Assessment definitions - supports SurveyJS format
export const assessments = pgTable("assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicianUserId: varchar("clinician_user_id").references(() => users.id), // null for system assessments
  name: text("name").notNull(),
  description: text("description"),
  version: text("version").default("1.0"),
  assessmentType: text("assessment_type").notNull().default("patient"), // 'clinician' | 'patient'
  questions: jsonb("questions").notNull().default(sql`'[]'::jsonb`), // Legacy field - kept for compatibility
  surveyJson: jsonb("survey_json").notNull(), // Full SurveyJS definition (questions, pages, logic)
  scoringConfig: jsonb("scoring_config"), // Custom scoring rules: { tags: { tagName: { questionWeights: {...} } } }
  outcomeRules: jsonb("outcome_rules"), // Rules to determine primary outcome from tag scores
  isTemplate: boolean("is_template").default(false), // System templates vs clinician custom
  isPublished: boolean("is_published").default(false), // Draft vs published
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Patient invites (external assessments)
export const assessmentInvites = pgTable("assessment_invites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicianUserId: varchar("clinician_user_id").references(() => users.id).notNull(),
  assessmentId: varchar("assessment_id").references(() => assessments.id).notNull(),
  patientEmail: text("patient_email").notNull(),
  token: text("token").notNull().unique(),
  status: text("status").notNull().default("sent"), // 'sent' | 'opened' | 'completed'
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Assessment responses
export const assessmentResponses = pgTable("assessment_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  inviteId: varchar("invite_id").references(() => assessmentInvites.id),
  answers: jsonb("answers").notNull(),
  tagScores: jsonb("tag_scores"),
  recommendedContentIds: text("recommended_content_ids").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Internal screenings (done by clinician during visit)
export const internalScreenings = pgTable("internal_screenings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicianUserId: varchar("clinician_user_id").references(() => users.id).notNull(),
  assessmentId: varchar("assessment_id").references(() => assessments.id).notNull(),
  patientName: text("patient_name").notNull(),
  notes: text("notes"),
  answers: jsonb("answers").notNull(),
  tagScores: jsonb("tag_scores"),
  primaryOutcome: text("primary_outcome"),
  recommendedContentIds: text("recommended_content_ids").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Email send log
export const emailLogs = pgTable("email_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicianUserId: varchar("clinician_user_id").references(() => users.id).notNull(),
  patientEmail: text("patient_email").notNull(),
  subject: text("subject").notNull(),
  type: text("type").notNull(), // 'content_bundle' | 'assessment_invite' | 'assessment_results' | 'follow_up_reminder'
  contentIds: text("content_ids").array(),
  providerNote: text("provider_note"),
  accessCode: text("access_code"), // Deprecated: will be removed after migration to hashed codes
  accessCodeHash: text("access_code_hash"), // Secure hash of the access code
  accessCodeSalt: text("access_code_salt"), // Per-code salt for hashing
  accessCodeGeneratedAt: timestamp("access_code_generated_at"), // When code was generated (for expiration)
  status: text("status").default("sent"), // 'sent' | 'opened' | 'clicked'
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  // Lockout tracking
  failedAttempts: integer("failed_attempts").default(0),
  lockedUntil: timestamp("locked_until"),
  permanentlyLocked: boolean("permanently_locked").default(false),
  // Follow-up tracking
  isFollowUp: boolean("is_follow_up").default(false),
  parentEmailLogId: varchar("parent_email_log_id"), // references the original email this is following up on
  followUpRuleId: varchar("follow_up_rule_id"), // which rule triggered this follow-up
});

// Content view tracking - tracks when patients view content from emails
export const contentViews = pgTable("content_views", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  emailLogId: varchar("email_log_id").references(() => emailLogs.id).notNull(),
  contentId: varchar("content_id").notNull(),
  patientEmail: text("patient_email").notNull(),
  token: text("token").notNull().unique(),
  viewedAt: timestamp("viewed_at"),
  timeSpentSeconds: integer("time_spent_seconds"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Automated follow-up rules
export const followUpRules = pgTable("follow_up_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicianUserId: varchar("clinician_user_id").references(() => users.id), // null for system templates
  name: text("name").notNull(),
  triggerType: text("trigger_type").notNull(), // 'no_view' | 'partial_view' | 'time_based' | 'assessment_complete'
  triggerDays: integer("trigger_days").notNull().default(3), // days after initial send
  action: text("action").notNull(), // 'send_reminder' | 'send_new_content' | 'send_assessment'
  contentIds: text("content_ids").array(), // content to send if action is send_new_content
  message: text("message"), // custom message to include
  isActive: boolean("is_active").default(true),
  isTemplate: boolean("is_template").default(false), // true for system templates
  templateKey: text("template_key"), // unique key for templates (e.g., 'no_view_3day')
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User preferences for template follow-up rules
export const userTemplatePreferences = pgTable("user_template_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  templateRuleId: varchar("template_rule_id").references(() => followUpRules.id).notNull(),
  isEnabled: boolean("is_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Scheduled follow-ups (instances of rules triggered)
export const scheduledFollowUps = pgTable("scheduled_follow_ups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ruleId: varchar("rule_id").references(() => followUpRules.id).notNull(),
  emailLogId: varchar("email_log_id").references(() => emailLogs.id).notNull(),
  patientEmail: text("patient_email").notNull(),
  scheduledFor: timestamp("scheduled_for").notNull(),
  status: text("status").notNull().default("pending"), // 'pending' | 'sent' | 'cancelled' | 'skipped'
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Care pathways - structured treatment protocols
export const carePathways = pgTable("care_pathways", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicianUserId: varchar("clinician_user_id").references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  condition: text("condition"), // e.g., 'low_back_pain', 'neck_pain'
  durationWeeks: integer("duration_weeks").default(8),
  isTemplate: boolean("is_template").default(false), // system templates vs custom
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Pathway milestones - stages within a care pathway
export const pathwayMilestones = pgTable("pathway_milestones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pathwayId: varchar("pathway_id").references(() => carePathways.id).notNull(),
  weekNumber: integer("week_number").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  contentIds: text("content_ids").array(), // content to deliver at this milestone
  assessmentId: varchar("assessment_id").references(() => assessments.id), // optional assessment
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Patient pathway enrollments
export const patientPathways = pgTable("patient_pathways", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicianUserId: varchar("clinician_user_id").references(() => users.id).notNull(),
  pathwayId: varchar("pathway_id").references(() => carePathways.id).notNull(),
  patientEmail: text("patient_email").notNull(),
  patientName: text("patient_name"),
  startDate: timestamp("start_date").notNull(),
  currentWeek: integer("current_week").default(1),
  status: text("status").notNull().default("active"), // 'active' | 'completed' | 'paused' | 'discontinued'
  completedMilestones: text("completed_milestones").array().default(sql`ARRAY[]::text[]`),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Content recommendations based on assessment scores
export const contentRecommendations = pgTable("content_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tag: text("tag").notNull(), // the content tag this rule applies to
  minScore: integer("min_score").default(0), // minimum assessment score for this tag
  maxScore: integer("max_score").default(100), // maximum score
  priority: integer("priority").default(1), // recommendation priority (1 = highest)
  contentId: varchar("content_id").references(() => contentItems.id).notNull(),
  rationale: text("rationale"), // why this content is recommended
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Recommendation configs - links assessments, pathways, and content with clinician rules
export const recommendationConfigs = pgTable("recommendation_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicianUserId: varchar("clinician_user_id").references(() => users.id), // null for system rules
  name: text("name").notNull(), // descriptive name for the rule
  assessmentId: varchar("assessment_id").references(() => assessments.id), // required: which assessment triggers this rule
  pathwayId: varchar("pathway_id").references(() => carePathways.id), // optional: scope to specific pathway
  pathwayWeek: integer("pathway_week"), // optional: scope to specific week in pathway
  
  // Answer-based trigger configuration
  questionName: text("question_name"), // the specific question this rule triggers on
  questionType: text("question_type"), // 'boolean' | 'rating' | 'radiogroup' | 'dropdown' | 'checkbox' | 'text'
  matchOperator: text("match_operator").default("equals"), // 'equals' | 'in' | 'not_equals' | 'greater_than' | 'less_than' | 'between'
  matchValues: jsonb("match_values"), // the answer value(s) that trigger this rule (e.g., ["Yes"], [4, 5], {"min": 60, "max": 100})
  
  // Legacy tag-based scoring (kept for backward compatibility)
  tag: text("tag").notNull().default(""), // the assessment tag this rule triggers on (legacy)
  minScore: integer("min_score").default(0),
  maxScore: integer("max_score").default(100),
  
  priority: integer("priority").default(1), // lower = higher priority
  contentIds: text("content_ids").array().notNull().default(sql`ARRAY[]::text[]`), // content to recommend
  rationale: text("rationale"), // clinician-facing explanation of why this rule exists
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Patient recommendations - tracks what was recommended and why (for clinician review)
export const patientRecommendations = pgTable("patient_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientEmail: text("patient_email").notNull(),
  clinicianUserId: varchar("clinician_user_id").references(() => users.id).notNull(),
  source: text("source").notNull(), // 'assessment' | 'pathway_milestone' | 'manual'
  sourceId: text("source_id"), // assessment_response_id or patient_pathway_id
  assessmentId: varchar("assessment_id").references(() => assessments.id),
  pathwayId: varchar("pathway_id").references(() => carePathways.id),
  pathwayWeek: integer("pathway_week"),
  tagScores: jsonb("tag_scores"), // snapshot of scores at recommendation time
  matchedRuleIds: text("matched_rule_ids").array(), // which rules fired
  recommendedContentIds: text("recommended_content_ids").array().notNull(),
  contentRationale: jsonb("content_rationale"), // { contentId: "rationale for this content" }
  status: text("status").notNull().default("generated"), // 'generated' | 'sent' | 'viewed' | 'dismissed'
  sentViaEmailLogId: varchar("sent_via_email_log_id").references(() => emailLogs.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Audit log for compliance tracking (HIPAA-compliant immutable log)
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id), // null for patient portal or system actions
  actorType: text("actor_type").notNull().default("clinician"), // 'clinician' | 'admin' | 'patient' | 'system'
  actorEmail: text("actor_email"), // email of actor (useful for patient portal where no userId)
  action: text("action").notNull(), // 'login' | 'logout' | 'login_failed' | 'content_access' | 'phi_view' | 'phi_export' | 'email_sent' | 'settings_change' | 'user_create' | 'user_update' | 'password_change' | 'session_timeout'
  resourceType: text("resource_type"), // 'patient' | 'content' | 'assessment' | 'email_log' | 'user' | 'session'
  resourceId: text("resource_id"),
  phiAccessed: boolean("phi_accessed").default(false), // true if PHI was accessed in this action
  phiScope: text("phi_scope"), // description of what PHI was accessed (e.g., 'patient email, content history')
  details: jsonb("details"), // additional context (must not contain PHI)
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  sessionId: text("session_id"), // track which session performed the action
  outcome: text("outcome").default("success"), // 'success' | 'failure' | 'denied'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Patient portal sessions (persistent, trackable)
export const patientSessions = pgTable("patient_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  token: text("token").notNull().unique(), // UUID session token
  patientEmail: text("patient_email").notNull(),
  emailLogId: varchar("email_log_id").references(() => emailLogs.id).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  lastActivity: timestamp("last_activity").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Role permissions for RBAC
export const permissions = pgTable("permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(), // 'content:read' | 'content:write' | 'patient:read' | 'patient:write' | 'user:manage' | 'audit:view' | 'settings:manage'
  description: text("description"),
  category: text("category").notNull(), // 'content' | 'patient' | 'user' | 'audit' | 'settings'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Role-permission mappings
export const rolePermissions = pgTable("role_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  role: text("role").notNull(), // 'clinician' | 'admin' | 'super_admin' | 'readonly' | 'support'
  permissionId: varchar("permission_id").references(() => permissions.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User-level permission overrides - allows granting/revoking permissions for specific users
export const userPermissions = pgTable("user_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  permissionId: varchar("permission_id").references(() => permissions.id).notNull(),
  granted: boolean("granted").notNull().default(true), // true = grant, false = revoke
  grantedBy: varchar("granted_by").references(() => users.id).notNull(),
  reason: text("reason"), // Why this override was applied
  expiresAt: timestamp("expires_at"), // Optional expiration for temporary grants
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Persona switch audit log - tracks when super admins switch personas
export const personaSwitches = pgTable("persona_switches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  fromPersona: text("from_persona").notNull(), // Original role
  toPersona: text("to_persona").notNull(), // Switched to role
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  switchedAt: timestamp("switched_at").defaultNow().notNull(),
  switchedBackAt: timestamp("switched_back_at"), // When they switched back
});

// Data inventory for classification and compliance
export const dataInventory = pgTable("data_inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dataAssetName: text("data_asset_name").notNull(), // e.g., 'Patient Email Addresses', 'Assessment Responses'
  tableName: text("table_name"), // database table if applicable
  fieldName: text("field_name"), // specific field if applicable
  dataClassification: text("data_classification").notNull(), // 'PHI' | 'PII' | 'Sensitive' | 'Internal' | 'Public'
  description: text("description"),
  containsPhi: boolean("contains_phi").default(false),
  phiTypes: text("phi_types").array(), // 'email' | 'name' | 'health_data' | 'assessment_scores'
  encryptedAtRest: boolean("encrypted_at_rest").default(true),
  encryptedInTransit: boolean("encrypted_in_transit").default(true),
  retentionDays: integer("retention_days"), // how long to keep before disposal
  disposalMethod: text("disposal_method"), // 'secure_delete' | 'anonymize' | 'archive'
  accessRoles: text("access_roles").array(), // which roles can access this data
  lastReviewedAt: timestamp("last_reviewed_at"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Admin notes on user records
export const adminNotes = pgTable("admin_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  adminId: varchar("admin_id").references(() => users.id).notNull(),
  note: text("note").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User login history for tracking
export const loginHistory = pgTable("login_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  outcome: text("outcome").notNull().default("success"), // 'success' | 'failure'
  failureReason: text("failure_reason"), // 'invalid_password' | 'account_locked' | etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
});

export const insertContentItemSchema = createInsertSchema(contentItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAssessmentInviteSchema = createInsertSchema(assessmentInvites).omit({
  id: true,
  token: true,
  status: true,
  completedAt: true,
  createdAt: true,
});

export const insertInternalScreeningSchema = createInsertSchema(internalScreenings).omit({
  id: true,
  createdAt: true,
});

export const insertEmailLogSchema = createInsertSchema(emailLogs).omit({
  id: true,
  sentAt: true,
});

export const insertContentViewSchema = createInsertSchema(contentViews).omit({
  id: true,
  token: true,
  viewedAt: true,
  timeSpentSeconds: true,
  createdAt: true,
});

export const insertFollowUpRuleSchema = createInsertSchema(followUpRules).omit({
  id: true,
  isActive: true,
  isTemplate: true,
  createdAt: true,
});

export const insertUserTemplatePreferenceSchema = createInsertSchema(userTemplatePreferences).omit({
  id: true,
  createdAt: true,
});

export const insertScheduledFollowUpSchema = createInsertSchema(scheduledFollowUps).omit({
  id: true,
  status: true,
  sentAt: true,
  createdAt: true,
});

export const insertCarePathwaySchema = createInsertSchema(carePathways).omit({
  id: true,
  isActive: true,
  createdAt: true,
});

export const insertPathwayMilestoneSchema = createInsertSchema(pathwayMilestones).omit({
  id: true,
  createdAt: true,
});

export const insertPatientPathwaySchema = createInsertSchema(patientPathways).omit({
  id: true,
  currentWeek: true,
  status: true,
  completedMilestones: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContentRecommendationSchema = createInsertSchema(contentRecommendations).omit({
  id: true,
  createdAt: true,
});

export const insertRecommendationConfigSchema = createInsertSchema(recommendationConfigs).omit({
  id: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPatientRecommendationSchema = createInsertSchema(patientRecommendations).omit({
  id: true,
  status: true,
  createdAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export const insertPatientSessionSchema = createInsertSchema(patientSessions).omit({
  id: true,
  lastActivity: true,
  isActive: true,
  createdAt: true,
});

export const insertPermissionSchema = createInsertSchema(permissions).omit({
  id: true,
  createdAt: true,
});

export const insertRolePermissionSchema = createInsertSchema(rolePermissions).omit({
  id: true,
  createdAt: true,
});

export const insertUserPermissionSchema = createInsertSchema(userPermissions).omit({
  id: true,
  createdAt: true,
});

export const insertPersonaSwitchSchema = createInsertSchema(personaSwitches).omit({
  id: true,
  switchedAt: true,
  switchedBackAt: true,
});

export const insertDataInventorySchema = createInsertSchema(dataInventory).omit({
  id: true,
  lastReviewedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  usedAt: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type User = typeof users.$inferSelect;

export type InsertContentItem = z.infer<typeof insertContentItemSchema>;
export type ContentItem = typeof contentItems.$inferSelect;

export type InsertAssessmentInvite = z.infer<typeof insertAssessmentInviteSchema>;
export type AssessmentInvite = typeof assessmentInvites.$inferSelect;

export type InsertInternalScreening = z.infer<typeof insertInternalScreeningSchema>;
export type InternalScreening = typeof internalScreenings.$inferSelect;

export type InsertEmailLog = z.infer<typeof insertEmailLogSchema>;
export type EmailLog = typeof emailLogs.$inferSelect;

export type InsertContentView = z.infer<typeof insertContentViewSchema>;
export type ContentView = typeof contentViews.$inferSelect;

export const insertAssessmentSchema = createInsertSchema(assessments).omit({
  id: true,
  isPublished: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type Assessment = typeof assessments.$inferSelect;

export const insertAssessmentResponseSchema = createInsertSchema(assessmentResponses).omit({
  id: true,
  createdAt: true,
});
export type InsertAssessmentResponse = z.infer<typeof insertAssessmentResponseSchema>;
export type AssessmentResponse = typeof assessmentResponses.$inferSelect;

export type InsertFollowUpRule = z.infer<typeof insertFollowUpRuleSchema>;
export type FollowUpRule = typeof followUpRules.$inferSelect;

export type InsertUserTemplatePreference = z.infer<typeof insertUserTemplatePreferenceSchema>;
export type UserTemplatePreference = typeof userTemplatePreferences.$inferSelect;

export type InsertScheduledFollowUp = z.infer<typeof insertScheduledFollowUpSchema>;
export type ScheduledFollowUp = typeof scheduledFollowUps.$inferSelect;

export type InsertCarePathway = z.infer<typeof insertCarePathwaySchema>;
export type CarePathway = typeof carePathways.$inferSelect;

export type InsertPathwayMilestone = z.infer<typeof insertPathwayMilestoneSchema>;
export type PathwayMilestone = typeof pathwayMilestones.$inferSelect;

export type InsertPatientPathway = z.infer<typeof insertPatientPathwaySchema>;
export type PatientPathway = typeof patientPathways.$inferSelect;

export type InsertContentRecommendation = z.infer<typeof insertContentRecommendationSchema>;
export type ContentRecommendation = typeof contentRecommendations.$inferSelect;

export type InsertRecommendationConfig = z.infer<typeof insertRecommendationConfigSchema>;
export type RecommendationConfig = typeof recommendationConfigs.$inferSelect;

export type InsertPatientRecommendation = z.infer<typeof insertPatientRecommendationSchema>;
export type PatientRecommendation = typeof patientRecommendations.$inferSelect;

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

export type InsertPatientSession = z.infer<typeof insertPatientSessionSchema>;
export type PatientSession = typeof patientSessions.$inferSelect;

export type InsertPermission = z.infer<typeof insertPermissionSchema>;
export type Permission = typeof permissions.$inferSelect;

export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;
export type RolePermission = typeof rolePermissions.$inferSelect;

export type InsertUserPermission = z.infer<typeof insertUserPermissionSchema>;
export type UserPermission = typeof userPermissions.$inferSelect;

export type InsertPersonaSwitch = z.infer<typeof insertPersonaSwitchSchema>;
export type PersonaSwitch = typeof personaSwitches.$inferSelect;

export type InsertDataInventory = z.infer<typeof insertDataInventorySchema>;
export type DataInventory = typeof dataInventory.$inferSelect;

export const insertUserEmailConnectionSchema = createInsertSchema(userEmailConnections).omit({
  id: true,
  status: true,
  lastError: true,
  lastUsedAt: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUserEmailConnection = z.infer<typeof insertUserEmailConnectionSchema>;
export type UserEmailConnection = typeof userEmailConnections.$inferSelect;

// Subscription tiers and entitlements
export const SUBSCRIPTION_TIERS = {
  free: { level: 0, name: 'Free', monthlyPrice: 0 },
  basic: { level: 1, name: 'Basic', monthlyPrice: 19 },
  pro: { level: 2, name: 'Pro', monthlyPrice: 29 },
  enterprise: { level: 3, name: 'Enterprise', monthlyPrice: 99 },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;

// Tier entitlement matrix - what each tier can access
export const TIER_ENTITLEMENTS: Record<string, SubscriptionTier[]> = {
  // Core features - available to all paid tiers
  content_library: ['basic', 'pro', 'enterprise'],
  content_concierge: ['basic', 'pro', 'enterprise'],
  content_packets: ['basic', 'pro', 'enterprise'],
  internal_screenings: ['basic', 'pro', 'enterprise'],
  
  // Limited features - basic has limits
  assessment_builder: ['basic', 'pro', 'enterprise'], // Basic limited to 5 assessments
  
  // Pro-only features
  patient_portal: ['pro', 'enterprise'],
  email_delivery: ['pro', 'enterprise'],
  care_pathways: ['pro', 'enterprise'],
  follow_up_automation: ['pro', 'enterprise'],
  priority_support: ['pro', 'enterprise'],
  custom_branding: ['pro', 'enterprise'],
  
  // Enterprise-only
  white_label: ['enterprise'],
  api_access: ['enterprise'],
  sso: ['enterprise'],
};

// Feature flags - global system settings managed by super admins
export const featureFlags = pgTable("feature_flags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  isEnabled: boolean("is_enabled").notNull().default(true),
  value: text("value"), // For enum-style flags (e.g., 'email' | 'packet')
  payload: jsonb("payload"), // Additional configuration data
  tiersAllowed: text("tiers_allowed").array().default(sql`ARRAY['basic', 'pro', 'enterprise']`), // Which tiers can access this feature
  category: text("category").default("general"), // 'general' | 'content_delivery' | 'compliance' | 'features'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertFeatureFlagSchema = createInsertSchema(featureFlags).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertFeatureFlag = z.infer<typeof insertFeatureFlagSchema>;
export type FeatureFlag = typeof featureFlags.$inferSelect;

// User feature overrides - per-user feature flag overrides set by admins
export const userFeatureOverrides = pgTable("user_feature_overrides", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  featureFlagId: varchar("feature_flag_id").references(() => featureFlags.id).notNull(),
  isEnabled: boolean("is_enabled").notNull(),
  setByAdminId: varchar("set_by_admin_id").references(() => users.id),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserFeature: uniqueIndex("user_feature_override_unique_idx").on(table.userId, table.featureFlagId),
}));

export const insertUserFeatureOverrideSchema = createInsertSchema(userFeatureOverrides).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertUserFeatureOverride = z.infer<typeof insertUserFeatureOverrideSchema>;
export type UserFeatureOverride = typeof userFeatureOverrides.$inferSelect;

// Feature flag audit log - tracks all changes to user feature flag overrides
export const featureFlagAuditLog = pgTable("feature_flag_audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  featureFlagId: varchar("feature_flag_id").references(() => featureFlags.id).notNull(),
  adminId: varchar("admin_id").references(() => users.id).notNull(),
  action: text("action").notNull(), // 'enable' | 'disable' | 'reset'
  previousValue: boolean("previous_value"), // null if no previous override existed
  newValue: boolean("new_value"), // null if reset (removed override)
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertFeatureFlagAuditLogSchema = createInsertSchema(featureFlagAuditLog).omit({
  id: true,
  createdAt: true,
});
export type InsertFeatureFlagAuditLog = z.infer<typeof insertFeatureFlagAuditLogSchema>;
export type FeatureFlagAuditLog = typeof featureFlagAuditLog.$inferSelect;

// Admin notes schemas
export const insertAdminNoteSchema = createInsertSchema(adminNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAdminNote = z.infer<typeof insertAdminNoteSchema>;
export type AdminNote = typeof adminNotes.$inferSelect;

// Login history schemas
export const insertLoginHistorySchema = createInsertSchema(loginHistory).omit({
  id: true,
  createdAt: true,
});
export type InsertLoginHistory = z.infer<typeof insertLoginHistorySchema>;
export type LoginHistory = typeof loginHistory.$inferSelect;

// User favorites - bookmarked content for quick access
export const userFavorites = pgTable("user_favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  contentId: varchar("content_id").references(() => contentItems.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserFavoriteSchema = createInsertSchema(userFavorites).omit({
  id: true,
  createdAt: true,
});
export type InsertUserFavorite = z.infer<typeof insertUserFavoriteSchema>;
export type UserFavorite = typeof userFavorites.$inferSelect;

// Content collections - user-created content groups
export const contentCollections = pgTable("content_collections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertContentCollectionSchema = createInsertSchema(contentCollections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertContentCollection = z.infer<typeof insertContentCollectionSchema>;
export type ContentCollection = typeof contentCollections.$inferSelect;

// Collection items - content within a collection
export const collectionItems = pgTable("collection_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  collectionId: varchar("collection_id").references(() => contentCollections.id).notNull(),
  contentId: varchar("content_id").references(() => contentItems.id).notNull(),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCollectionItemSchema = createInsertSchema(collectionItems).omit({
  id: true,
  createdAt: true,
});
export type InsertCollectionItem = z.infer<typeof insertCollectionItemSchema>;
export type CollectionItem = typeof collectionItems.$inferSelect;

// Clinic branding - custom branding for PDF content packets (Pro/Enterprise feature)
export const clinicBranding = pgTable("clinic_branding", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  
  // Logo and basic info
  logoUrl: text("logo_url"), // Uploaded clinic logo URL
  clinicName: text("clinic_name"), // Custom display name used in branded content/PDFs
  tagline: text("tagline"), // Optional tagline below clinic name
  
  // Color scheme
  primaryColor: text("primary_color").default("#0F766E"), // Headers, main elements
  secondaryColor: text("secondary_color").default("#f5f5f5"), // Backgrounds
  accentColor: text("accent_color").default("#14B8A6"), // Links, highlights
  
  // Footer and additional options
  footerText: text("footer_text"), // Custom footer (replaces "Powered by DriverPath")
  showPoweredBy: boolean("show_powered_by").default(true), // Whether to show "Powered by DriverPath"
  
  // Activation status
  isActive: boolean("is_active").default(true), // Can be deactivated if subscription changes
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertClinicBrandingSchema = createInsertSchema(clinicBranding).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertClinicBranding = z.infer<typeof insertClinicBrandingSchema>;
export type ClinicBranding = typeof clinicBranding.$inferSelect;

// API request schema - only allows client-editable fields (excludes server-controlled fields)
export const brandingRequestSchema = z.object({
  logoUrl: z.string().url().startsWith('https://').max(2048).nullable().optional()
    .or(z.literal('').transform(() => null)),
  clinicName: z.string().max(200).nullable().optional()
    .or(z.literal('').transform(() => null)),
  tagline: z.string().max(500).nullable().optional()
    .or(z.literal('').transform(() => null)),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color (#RRGGBB)').nullable().optional()
    .or(z.literal('').transform(() => null)),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color (#RRGGBB)').nullable().optional()
    .or(z.literal('').transform(() => null)),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color (#RRGGBB)').nullable().optional()
    .or(z.literal('').transform(() => null)),
  footerText: z.string().max(1000).nullable().optional()
    .or(z.literal('').transform(() => null)),
  showPoweredBy: z.boolean().nullable().optional(),
});
export type BrandingRequest = z.infer<typeof brandingRequestSchema>;
