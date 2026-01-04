import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - clinicians who subscribe to the platform
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  role: text("role").notNull().default("clinician"), // 'clinician' | 'admin'
  
  // Subscription fields
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status").default("inactive"), // 'active' | 'inactive' | 'past_due' | 'canceled'
  subscriptionPeriodEnd: timestamp("subscription_period_end"),
  
  lastLogin: timestamp("last_login"),
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

// Assessment definitions
export const assessments = pgTable("assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  version: text("version").default("1.0"),
  questions: jsonb("questions").notNull(), // array of question objects
  scoringRules: jsonb("scoring_rules"), // how to calculate tag scores
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
  role: text("role").notNull(), // 'clinician' | 'admin' | 'readonly' | 'support'
  permissionId: varchar("permission_id").references(() => permissions.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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

export const insertDataInventorySchema = createInsertSchema(dataInventory).omit({
  id: true,
  lastReviewedAt: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
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

export type Assessment = typeof assessments.$inferSelect;
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

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

export type InsertPatientSession = z.infer<typeof insertPatientSessionSchema>;
export type PatientSession = typeof patientSessions.$inferSelect;

export type InsertPermission = z.infer<typeof insertPermissionSchema>;
export type Permission = typeof permissions.$inferSelect;

export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;
export type RolePermission = typeof rolePermissions.$inferSelect;

export type InsertDataInventory = z.infer<typeof insertDataInventorySchema>;
export type DataInventory = typeof dataInventory.$inferSelect;
