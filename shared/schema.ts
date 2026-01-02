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
  type: text("type").notNull(), // 'content_bundle' | 'assessment_invite' | 'assessment_results'
  contentIds: text("content_ids").array(),
  providerNote: text("provider_note"),
  status: text("status").default("sent"), // 'sent' | 'opened' | 'clicked'
  sentAt: timestamp("sent_at").defaultNow().notNull(),
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
