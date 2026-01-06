import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import { 
  type User, 
  type InsertUser, 
  type ContentItem,
  type InsertContentItem,
  type AssessmentInvite,
  type InsertAssessmentInvite,
  type InternalScreening,
  type InsertInternalScreening,
  type EmailLog,
  type InsertEmailLog,
  type Assessment,
  type InsertAssessment,
  type AssessmentResponse,
  type InsertAssessmentResponse,
  type ContentView,
  type InsertContentView,
  type FollowUpRule,
  type InsertFollowUpRule,
  type ScheduledFollowUp,
  type InsertScheduledFollowUp,
  type CarePathway,
  type InsertCarePathway,
  type PathwayMilestone,
  type InsertPathwayMilestone,
  type PatientPathway,
  type InsertPatientPathway,
  type ContentRecommendation,
  type InsertContentRecommendation,
  type AuditLog,
  type InsertAuditLog,
  type UserTemplatePreference,
  type InsertUserTemplatePreference,
  type PatientSession,
  type InsertPatientSession,
  type Permission,
  type InsertPermission,
  type RolePermission,
  type InsertRolePermission,
  type DataInventory,
  type InsertDataInventory,
  type RecommendationConfig,
  type InsertRecommendationConfig,
  type PatientRecommendation,
  type InsertPatientRecommendation
} from "@shared/schema";
import crypto from "crypto";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { eq, desc, and, gte, lte, count, sql } from "drizzle-orm";

const PostgresSessionStore = connectPg(session);

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
});

const db = drizzle({ client: pool, schema });

export interface IStorage {
  // Auth
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(userId: string, updates: { name?: string; email?: string; role?: string }): Promise<void>;
  updateUserRole(userId: string, role: string): Promise<void>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<void>;
  updateLastLogin(userId: string): Promise<void>;
  updateUserSubscription(
    userId: string, 
    subscription: {
      stripeCustomerId?: string;
      stripeSubscriptionId?: string;
      subscriptionStatus?: string;
      subscriptionPeriodEnd?: Date;
    }
  ): Promise<void>;
  updateOnboardingStatus(userId: string, updates: { onboardingCompleted?: boolean; onboardingStep?: number }): Promise<void>;

  // Content
  getAllContent(): Promise<ContentItem[]>;
  getContentById(id: string): Promise<ContentItem | undefined>;
  createContent(content: InsertContentItem): Promise<ContentItem>;
  updateContent(id: string, content: Partial<InsertContentItem>): Promise<ContentItem | undefined>;
  deleteContent(id: string): Promise<void>;

  // Assessments
  getDefaultAssessment(): Promise<Assessment | undefined>;
  getAssessmentById(id: string): Promise<Assessment | undefined>;
  getAssessmentsByClinicianId(clinicianId: string): Promise<Assessment[]>;
  getTemplateAssessments(): Promise<Assessment[]>;
  getAllAssessments(): Promise<Assessment[]>;
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  updateAssessment(id: string, updates: Partial<InsertAssessment> & { isPublished?: boolean }): Promise<Assessment | undefined>;
  deleteAssessment(id: string): Promise<void>;
  
  // Assessment responses
  createAssessmentResponse(response: InsertAssessmentResponse): Promise<AssessmentResponse>;
  getAssessmentResponseByInviteId(inviteId: string): Promise<AssessmentResponse | undefined>;
  
  // Assessment invites
  createAssessmentInvite(invite: InsertAssessmentInvite): Promise<AssessmentInvite>;
  getAssessmentInviteById(id: string): Promise<AssessmentInvite | undefined>;
  getAssessmentInvitesByClinicianId(clinicianId: string): Promise<AssessmentInvite[]>;
  getAssessmentInvitesByPatientEmail(clinicianId: string, patientEmail: string): Promise<AssessmentInvite[]>;
  getAssessmentInvitesByPatientEmailPublic(patientEmail: string): Promise<AssessmentInvite[]>;
  getAssessmentInviteByToken(token: string): Promise<AssessmentInvite | undefined>;
  updateAssessmentInviteStatus(id: string, status: string, completedAt?: Date): Promise<void>;

  // Internal screenings
  createInternalScreening(screening: InsertInternalScreening): Promise<InternalScreening>;
  getInternalScreeningsByClinicianId(clinicianId: string): Promise<InternalScreening[]>;

  // Email logs
  createEmailLog(log: InsertEmailLog): Promise<EmailLog>;
  getEmailLogById(id: string): Promise<EmailLog | undefined>;
  getEmailLogsByClinicianId(clinicianId: string): Promise<EmailLog[]>;
  getEmailLogsByPatientEmail(clinicianId: string, patientEmail: string): Promise<EmailLog[]>;
  getEmailLogsByPatientEmailAndAccessCode(patientEmail: string, accessCode: string): Promise<EmailLog[]>;
  getEmailLogByAccessCode(accessCode: string): Promise<EmailLog | undefined>;
  updateEmailLogStatus(id: string, status: string): Promise<void>;
  updateEmailLogLockout(id: string, updates: { failedAttempts?: number; lockedUntil?: Date | null; permanentlyLocked?: boolean }): Promise<void>;
  unlockEmailLog(id: string): Promise<void>;

  // Content views
  createContentView(view: InsertContentView): Promise<ContentView>;
  getContentViewByToken(token: string): Promise<ContentView | undefined>;
  updateContentView(id: string, updates: { viewedAt?: Date; timeSpentSeconds?: number }): Promise<void>;
  getContentViewsByEmailLogId(emailLogId: string): Promise<ContentView[]>;

  // Admin functions
  getAllUsers(): Promise<User[]>;
  deleteUser(userId: string): Promise<void>;

  // Follow-up rules
  createFollowUpRule(rule: InsertFollowUpRule): Promise<FollowUpRule>;
  getFollowUpRulesByClinicianId(clinicianId: string): Promise<FollowUpRule[]>;
  getTemplateFollowUpRules(): Promise<FollowUpRule[]>;
  updateFollowUpRule(id: string, updates: Partial<InsertFollowUpRule> & { isActive?: boolean }): Promise<void>;
  deleteFollowUpRule(id: string): Promise<void>;

  // User template preferences
  getUserTemplatePreferences(userId: string): Promise<UserTemplatePreference[]>;
  setUserTemplatePreference(userId: string, templateRuleId: string, isEnabled: boolean): Promise<UserTemplatePreference>;
  getEnabledTemplatesForUser(userId: string): Promise<FollowUpRule[]>;

  // Scheduled follow-ups
  createScheduledFollowUp(followUp: InsertScheduledFollowUp): Promise<ScheduledFollowUp>;
  getPendingFollowUps(): Promise<ScheduledFollowUp[]>;
  getScheduledFollowUpsByClinicianId(clinicianId: string): Promise<ScheduledFollowUp[]>;
  updateScheduledFollowUpStatus(id: string, status: string, sentAt?: Date): Promise<void>;

  // Care pathways
  createCarePathway(pathway: InsertCarePathway): Promise<CarePathway>;
  getCarePathways(clinicianId?: string): Promise<CarePathway[]>;
  getCarePathwayById(id: string): Promise<CarePathway | undefined>;
  updateCarePathway(id: string, updates: Partial<InsertCarePathway> & { isActive?: boolean }): Promise<void>;
  deleteCarePathway(id: string): Promise<void>;

  // Pathway milestones
  createPathwayMilestone(milestone: InsertPathwayMilestone): Promise<PathwayMilestone>;
  getMilestonesByPathwayId(pathwayId: string): Promise<PathwayMilestone[]>;
  updatePathwayMilestone(id: string, updates: Partial<InsertPathwayMilestone>): Promise<void>;
  deletePathwayMilestone(id: string): Promise<void>;

  // Patient pathways
  createPatientPathway(enrollment: InsertPatientPathway): Promise<PatientPathway>;
  getPatientPathwaysByClinicianId(clinicianId: string): Promise<PatientPathway[]>;
  getPatientPathwayById(id: string): Promise<PatientPathway | undefined>;
  updatePatientPathway(id: string, updates: Partial<PatientPathway>): Promise<void>;

  // Content recommendations (legacy simple rules)
  createContentRecommendation(rec: InsertContentRecommendation): Promise<ContentRecommendation>;
  getContentRecommendations(): Promise<ContentRecommendation[]>;
  getRecommendationsForScores(tagScores: Record<string, number>): Promise<ContentRecommendation[]>;
  deleteContentRecommendation(id: string): Promise<void>;

  // Recommendation configs (advanced rules with pathway support)
  createRecommendationConfig(config: InsertRecommendationConfig): Promise<RecommendationConfig>;
  getRecommendationConfigs(filters?: { clinicianId?: string; assessmentId?: string; pathwayId?: string; isActive?: boolean }): Promise<RecommendationConfig[]>;
  getRecommendationConfigById(id: string): Promise<RecommendationConfig | undefined>;
  updateRecommendationConfig(id: string, updates: Partial<InsertRecommendationConfig> & { isActive?: boolean }): Promise<RecommendationConfig | undefined>;
  deleteRecommendationConfig(id: string): Promise<void>;

  // Patient recommendations (tracking what was recommended)
  createPatientRecommendation(rec: InsertPatientRecommendation): Promise<PatientRecommendation>;
  getPatientRecommendations(filters: { clinicianId?: string; patientEmail?: string; source?: string }): Promise<PatientRecommendation[]>;
  getPatientRecommendationById(id: string): Promise<PatientRecommendation | undefined>;
  updatePatientRecommendationStatus(id: string, status: string, emailLogId?: string): Promise<void>;

  // Audit logs
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(filters?: { userId?: string; action?: string; actorType?: string; startDate?: Date; endDate?: Date; limit?: number }): Promise<AuditLog[]>;

  // Patient sessions (persistent)
  createPatientSession(session: InsertPatientSession): Promise<PatientSession>;
  getPatientSessionByToken(token: string): Promise<PatientSession | undefined>;
  updatePatientSessionActivity(token: string): Promise<void>;
  invalidatePatientSession(token: string): Promise<void>;
  invalidateExpiredSessions(): Promise<number>;

  // Access code hashing
  hashAccessCode(code: string): Promise<{ hash: string; salt: string }>;
  verifyAccessCode(code: string, hash: string, salt: string): Promise<boolean>;
  createEmailLogWithHashedCode(log: InsertEmailLog, plainCode: string): Promise<EmailLog>;
  getEmailLogByHashedCode(patientEmail: string, plainCode: string): Promise<EmailLog | undefined>;

  // Permissions (RBAC)
  getPermissions(): Promise<Permission[]>;
  getPermissionsByRole(role: string): Promise<Permission[]>;
  createPermission(permission: InsertPermission): Promise<Permission>;
  assignPermissionToRole(role: string, permissionId: string): Promise<RolePermission>;
  removePermissionFromRole(role: string, permissionId: string): Promise<void>;
  hasPermission(role: string, permissionName: string): Promise<boolean>;

  // Data inventory
  getDataInventory(): Promise<DataInventory[]>;
  createDataInventoryItem(item: InsertDataInventory): Promise<DataInventory>;
  updateDataInventoryItem(id: string, updates: Partial<InsertDataInventory>): Promise<void>;
  deleteDataInventoryItem(id: string): Promise<void>;

  // Admin analytics
  getAdminStats(): Promise<{
    totalUsers: number;
    activeSubscriptions: number;
    totalContentSent: number;
    totalAssessments: number;
    recentSignups: number;
    mrr: number;
  }>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // Auth methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(schema.users).values(insertUser).returning();
    return user!;
  }

  async updateUser(userId: string, updates: { name?: string; email?: string; role?: string }): Promise<void> {
    await db.update(schema.users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.users.id, userId));
  }

  async updateUserRole(userId: string, role: string): Promise<void> {
    await db.update(schema.users)
      .set({ role, updatedAt: new Date() })
      .where(eq(schema.users.id, userId));
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    await db.update(schema.users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(schema.users.id, userId));
  }

  async updateLastLogin(userId: string): Promise<void> {
    await db.update(schema.users)
      .set({ lastLogin: new Date() })
      .where(eq(schema.users.id, userId));
  }

  async updateUserSubscription(
    userId: string,
    subscription: {
      stripeCustomerId?: string;
      stripeSubscriptionId?: string;
      subscriptionStatus?: string;
      subscriptionPeriodEnd?: Date;
    }
  ): Promise<void> {
    await db.update(schema.users)
      .set({ ...subscription, updatedAt: new Date() })
      .where(eq(schema.users.id, userId));
  }

  async updateOnboardingStatus(userId: string, updates: { onboardingCompleted?: boolean; onboardingStep?: number }): Promise<void> {
    await db.update(schema.users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.users.id, userId));
  }

  // Content methods
  async getAllContent(): Promise<ContentItem[]> {
    return await db.select().from(schema.contentItems).orderBy(desc(schema.contentItems.createdAt));
  }

  async getContentById(id: string): Promise<ContentItem | undefined> {
    const [item] = await db.select().from(schema.contentItems).where(eq(schema.contentItems.id, id));
    return item;
  }

  async createContent(content: InsertContentItem): Promise<ContentItem> {
    const [item] = await db.insert(schema.contentItems).values(content).returning();
    return item!;
  }

  async updateContent(id: string, content: Partial<InsertContentItem>): Promise<ContentItem | undefined> {
    const [item] = await db.update(schema.contentItems)
      .set({ ...content, updatedAt: new Date() })
      .where(eq(schema.contentItems.id, id))
      .returning();
    return item;
  }

  async deleteContent(id: string): Promise<void> {
    await db.delete(schema.contentItems).where(eq(schema.contentItems.id, id));
  }

  // Assessment methods
  async getDefaultAssessment(): Promise<Assessment | undefined> {
    const [assessment] = await db.select().from(schema.assessments).where(eq(schema.assessments.isPublished, true)).limit(1);
    return assessment;
  }

  async getAssessmentById(id: string): Promise<Assessment | undefined> {
    const [assessment] = await db.select().from(schema.assessments).where(eq(schema.assessments.id, id));
    return assessment;
  }

  async getAssessmentsByClinicianId(clinicianId: string): Promise<Assessment[]> {
    return await db.select()
      .from(schema.assessments)
      .where(eq(schema.assessments.clinicianUserId, clinicianId))
      .orderBy(desc(schema.assessments.createdAt));
  }

  async getTemplateAssessments(): Promise<Assessment[]> {
    return await db.select()
      .from(schema.assessments)
      .where(eq(schema.assessments.isTemplate, true))
      .orderBy(desc(schema.assessments.createdAt));
  }

  async getAllAssessments(): Promise<Assessment[]> {
    return await db.select().from(schema.assessments).orderBy(desc(schema.assessments.createdAt));
  }

  async createAssessment(assessment: InsertAssessment): Promise<Assessment> {
    const [created] = await db.insert(schema.assessments).values(assessment).returning();
    return created!;
  }

  async updateAssessment(id: string, updates: Partial<InsertAssessment> & { isPublished?: boolean }): Promise<Assessment | undefined> {
    const [updated] = await db.update(schema.assessments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.assessments.id, id))
      .returning();
    return updated;
  }

  async deleteAssessment(id: string): Promise<void> {
    await db.delete(schema.assessments).where(eq(schema.assessments.id, id));
  }

  // Assessment response methods
  async createAssessmentResponse(response: InsertAssessmentResponse): Promise<AssessmentResponse> {
    const [created] = await db.insert(schema.assessmentResponses).values(response).returning();
    return created!;
  }

  async getAssessmentResponseByInviteId(inviteId: string): Promise<AssessmentResponse | undefined> {
    const [response] = await db.select()
      .from(schema.assessmentResponses)
      .where(eq(schema.assessmentResponses.inviteId, inviteId));
    return response;
  }

  // Assessment invite methods
  async createAssessmentInvite(invite: InsertAssessmentInvite): Promise<AssessmentInvite> {
    const token = crypto.randomUUID();
    const [created] = await db.insert(schema.assessmentInvites)
      .values({ ...invite, token })
      .returning();
    return created!;
  }

  async getAssessmentInviteById(id: string): Promise<AssessmentInvite | undefined> {
    const [invite] = await db.select()
      .from(schema.assessmentInvites)
      .where(eq(schema.assessmentInvites.id, id));
    return invite;
  }

  async getAssessmentInvitesByClinicianId(clinicianId: string): Promise<AssessmentInvite[]> {
    return await db.select()
      .from(schema.assessmentInvites)
      .where(eq(schema.assessmentInvites.clinicianUserId, clinicianId))
      .orderBy(desc(schema.assessmentInvites.createdAt));
  }

  async getAssessmentInvitesByPatientEmail(clinicianId: string, patientEmail: string): Promise<AssessmentInvite[]> {
    return await db.select()
      .from(schema.assessmentInvites)
      .where(
        and(
          eq(schema.assessmentInvites.clinicianUserId, clinicianId),
          eq(schema.assessmentInvites.patientEmail, patientEmail)
        )
      )
      .orderBy(desc(schema.assessmentInvites.createdAt));
  }

  async getAssessmentInvitesByPatientEmailPublic(patientEmail: string): Promise<AssessmentInvite[]> {
    return await db.select()
      .from(schema.assessmentInvites)
      .where(eq(schema.assessmentInvites.patientEmail, patientEmail))
      .orderBy(desc(schema.assessmentInvites.createdAt));
  }

  async getAssessmentInviteByToken(token: string): Promise<AssessmentInvite | undefined> {
    const [invite] = await db.select()
      .from(schema.assessmentInvites)
      .where(eq(schema.assessmentInvites.token, token));
    return invite;
  }

  async updateAssessmentInviteStatus(id: string, status: string, completedAt?: Date): Promise<void> {
    await db.update(schema.assessmentInvites)
      .set({ status, completedAt })
      .where(eq(schema.assessmentInvites.id, id));
  }

  // Internal screening methods
  async createInternalScreening(screening: InsertInternalScreening): Promise<InternalScreening> {
    const [created] = await db.insert(schema.internalScreenings).values(screening).returning();
    return created!;
  }

  async getInternalScreeningsByClinicianId(clinicianId: string): Promise<InternalScreening[]> {
    return await db.select()
      .from(schema.internalScreenings)
      .where(eq(schema.internalScreenings.clinicianUserId, clinicianId))
      .orderBy(desc(schema.internalScreenings.createdAt));
  }

  // Email log methods
  async createEmailLog(log: InsertEmailLog): Promise<EmailLog> {
    const [created] = await db.insert(schema.emailLogs).values(log).returning();
    return created!;
  }

  async getEmailLogById(id: string): Promise<EmailLog | undefined> {
    const [log] = await db.select()
      .from(schema.emailLogs)
      .where(eq(schema.emailLogs.id, id));
    return log;
  }

  async getEmailLogsByClinicianId(clinicianId: string): Promise<EmailLog[]> {
    return await db.select()
      .from(schema.emailLogs)
      .where(eq(schema.emailLogs.clinicianUserId, clinicianId))
      .orderBy(desc(schema.emailLogs.sentAt));
  }

  async getEmailLogsByPatientEmail(clinicianId: string, patientEmail: string): Promise<EmailLog[]> {
    return await db.select()
      .from(schema.emailLogs)
      .where(
        and(
          eq(schema.emailLogs.clinicianUserId, clinicianId),
          eq(schema.emailLogs.patientEmail, patientEmail)
        )
      )
      .orderBy(desc(schema.emailLogs.sentAt));
  }

  async getEmailLogsByPatientEmailAndAccessCode(patientEmail: string, accessCode: string): Promise<EmailLog[]> {
    return await db.select()
      .from(schema.emailLogs)
      .where(
        and(
          eq(schema.emailLogs.patientEmail, patientEmail),
          eq(schema.emailLogs.accessCode, accessCode)
        )
      )
      .orderBy(desc(schema.emailLogs.sentAt));
  }

  async updateEmailLogStatus(id: string, status: string): Promise<void> {
    await db.update(schema.emailLogs)
      .set({ status })
      .where(eq(schema.emailLogs.id, id));
  }

  async updateEmailLogLockout(id: string, updates: { 
    failedAttempts?: number; 
    lockedUntil?: Date | null; 
    permanentlyLocked?: boolean;
  }): Promise<void> {
    await db.update(schema.emailLogs)
      .set(updates)
      .where(eq(schema.emailLogs.id, id));
  }

  async getEmailLogByAccessCode(accessCode: string): Promise<EmailLog | undefined> {
    const [log] = await db.select()
      .from(schema.emailLogs)
      .where(eq(schema.emailLogs.accessCode, accessCode));
    return log;
  }

  async unlockEmailLog(id: string): Promise<void> {
    await db.update(schema.emailLogs)
      .set({ 
        failedAttempts: 0, 
        lockedUntil: null, 
        permanentlyLocked: false 
      })
      .where(eq(schema.emailLogs.id, id));
  }

  // Content view methods
  async createContentView(view: InsertContentView): Promise<ContentView> {
    const token = crypto.randomUUID();
    const [created] = await db.insert(schema.contentViews).values({ ...view, token }).returning();
    return created!;
  }

  async getContentViewByToken(token: string): Promise<ContentView | undefined> {
    const [view] = await db.select()
      .from(schema.contentViews)
      .where(eq(schema.contentViews.token, token));
    return view;
  }

  async updateContentView(id: string, updates: { viewedAt?: Date; timeSpentSeconds?: number }): Promise<void> {
    await db.update(schema.contentViews)
      .set(updates)
      .where(eq(schema.contentViews.id, id));
  }

  async getContentViewsByEmailLogId(emailLogId: string): Promise<ContentView[]> {
    return await db.select()
      .from(schema.contentViews)
      .where(eq(schema.contentViews.emailLogId, emailLogId))
      .orderBy(desc(schema.contentViews.createdAt));
  }

  // Admin methods
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(schema.users).orderBy(desc(schema.users.createdAt));
  }

  async deleteUser(userId: string): Promise<void> {
    await db.delete(schema.users).where(eq(schema.users.id, userId));
  }

  // Follow-up rule methods
  async createFollowUpRule(rule: InsertFollowUpRule): Promise<FollowUpRule> {
    const [created] = await db.insert(schema.followUpRules).values(rule).returning();
    return created!;
  }

  async getFollowUpRulesByClinicianId(clinicianId: string): Promise<FollowUpRule[]> {
    return await db.select()
      .from(schema.followUpRules)
      .where(eq(schema.followUpRules.clinicianUserId, clinicianId))
      .orderBy(desc(schema.followUpRules.createdAt));
  }

  async updateFollowUpRule(id: string, updates: Partial<InsertFollowUpRule> & { isActive?: boolean }): Promise<void> {
    await db.update(schema.followUpRules)
      .set(updates)
      .where(eq(schema.followUpRules.id, id));
  }

  async deleteFollowUpRule(id: string): Promise<void> {
    await db.delete(schema.followUpRules).where(eq(schema.followUpRules.id, id));
  }

  async getTemplateFollowUpRules(): Promise<FollowUpRule[]> {
    return await db.select()
      .from(schema.followUpRules)
      .where(eq(schema.followUpRules.isTemplate, true))
      .orderBy(schema.followUpRules.triggerDays);
  }

  async getUserTemplatePreferences(userId: string): Promise<UserTemplatePreference[]> {
    return await db.select()
      .from(schema.userTemplatePreferences)
      .where(eq(schema.userTemplatePreferences.userId, userId));
  }

  async setUserTemplatePreference(userId: string, templateRuleId: string, isEnabled: boolean): Promise<UserTemplatePreference> {
    const existing = await db.select()
      .from(schema.userTemplatePreferences)
      .where(and(
        eq(schema.userTemplatePreferences.userId, userId),
        eq(schema.userTemplatePreferences.templateRuleId, templateRuleId)
      ));

    if (existing.length > 0) {
      await db.update(schema.userTemplatePreferences)
        .set({ isEnabled })
        .where(eq(schema.userTemplatePreferences.id, existing[0].id));
      return { ...existing[0], isEnabled };
    }

    const [created] = await db.insert(schema.userTemplatePreferences)
      .values({ userId, templateRuleId, isEnabled })
      .returning();
    return created!;
  }

  async getEnabledTemplatesForUser(userId: string): Promise<FollowUpRule[]> {
    const prefs = await this.getUserTemplatePreferences(userId);
    const enabledIds = prefs.filter(p => p.isEnabled).map(p => p.templateRuleId);
    
    if (enabledIds.length === 0) {
      return [];
    }
    
    const templates = await this.getTemplateFollowUpRules();
    return templates.filter(t => enabledIds.includes(t.id));
  }

  // Scheduled follow-up methods
  async createScheduledFollowUp(followUp: InsertScheduledFollowUp): Promise<ScheduledFollowUp> {
    const [created] = await db.insert(schema.scheduledFollowUps).values(followUp).returning();
    return created!;
  }

  async getPendingFollowUps(): Promise<ScheduledFollowUp[]> {
    return await db.select()
      .from(schema.scheduledFollowUps)
      .where(eq(schema.scheduledFollowUps.status, 'pending'))
      .orderBy(schema.scheduledFollowUps.scheduledFor);
  }

  async getScheduledFollowUpsByClinicianId(clinicianId: string): Promise<ScheduledFollowUp[]> {
    const followUps = await db.select()
      .from(schema.scheduledFollowUps)
      .innerJoin(schema.followUpRules, eq(schema.scheduledFollowUps.ruleId, schema.followUpRules.id))
      .where(eq(schema.followUpRules.clinicianUserId, clinicianId))
      .orderBy(desc(schema.scheduledFollowUps.scheduledFor));
    return followUps.map(f => f.scheduled_follow_ups);
  }

  async updateScheduledFollowUpStatus(id: string, status: string, sentAt?: Date): Promise<void> {
    await db.update(schema.scheduledFollowUps)
      .set({ status, sentAt })
      .where(eq(schema.scheduledFollowUps.id, id));
  }

  // Care pathway methods
  async createCarePathway(pathway: InsertCarePathway): Promise<CarePathway> {
    const [created] = await db.insert(schema.carePathways).values(pathway).returning();
    return created!;
  }

  async getCarePathways(clinicianId?: string): Promise<CarePathway[]> {
    if (clinicianId) {
      return await db.select()
        .from(schema.carePathways)
        .where(eq(schema.carePathways.clinicianUserId, clinicianId))
        .orderBy(desc(schema.carePathways.createdAt));
    }
    return await db.select()
      .from(schema.carePathways)
      .where(eq(schema.carePathways.isTemplate, true))
      .orderBy(desc(schema.carePathways.createdAt));
  }

  async getCarePathwayById(id: string): Promise<CarePathway | undefined> {
    const [pathway] = await db.select()
      .from(schema.carePathways)
      .where(eq(schema.carePathways.id, id));
    return pathway;
  }

  async updateCarePathway(id: string, updates: Partial<InsertCarePathway> & { isActive?: boolean }): Promise<void> {
    await db.update(schema.carePathways)
      .set(updates)
      .where(eq(schema.carePathways.id, id));
  }

  async deleteCarePathway(id: string): Promise<void> {
    await db.delete(schema.carePathways).where(eq(schema.carePathways.id, id));
  }

  // Pathway milestone methods
  async createPathwayMilestone(milestone: InsertPathwayMilestone): Promise<PathwayMilestone> {
    const [created] = await db.insert(schema.pathwayMilestones).values(milestone).returning();
    return created!;
  }

  async getMilestonesByPathwayId(pathwayId: string): Promise<PathwayMilestone[]> {
    return await db.select()
      .from(schema.pathwayMilestones)
      .where(eq(schema.pathwayMilestones.pathwayId, pathwayId))
      .orderBy(schema.pathwayMilestones.weekNumber);
  }

  async updatePathwayMilestone(id: string, updates: Partial<InsertPathwayMilestone>): Promise<void> {
    await db.update(schema.pathwayMilestones)
      .set(updates)
      .where(eq(schema.pathwayMilestones.id, id));
  }

  async deletePathwayMilestone(id: string): Promise<void> {
    await db.delete(schema.pathwayMilestones).where(eq(schema.pathwayMilestones.id, id));
  }

  // Patient pathway methods
  async createPatientPathway(enrollment: InsertPatientPathway): Promise<PatientPathway> {
    const [created] = await db.insert(schema.patientPathways).values(enrollment).returning();
    return created!;
  }

  async getPatientPathwaysByClinicianId(clinicianId: string): Promise<PatientPathway[]> {
    return await db.select()
      .from(schema.patientPathways)
      .where(eq(schema.patientPathways.clinicianUserId, clinicianId))
      .orderBy(desc(schema.patientPathways.createdAt));
  }

  async getPatientPathwayById(id: string): Promise<PatientPathway | undefined> {
    const [enrollment] = await db.select()
      .from(schema.patientPathways)
      .where(eq(schema.patientPathways.id, id));
    return enrollment;
  }

  async updatePatientPathway(id: string, updates: Partial<PatientPathway>): Promise<void> {
    await db.update(schema.patientPathways)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.patientPathways.id, id));
  }

  // Content recommendation methods
  async createContentRecommendation(rec: InsertContentRecommendation): Promise<ContentRecommendation> {
    const [created] = await db.insert(schema.contentRecommendations).values(rec).returning();
    return created!;
  }

  async getContentRecommendations(): Promise<ContentRecommendation[]> {
    return await db.select()
      .from(schema.contentRecommendations)
      .orderBy(schema.contentRecommendations.priority);
  }

  async getRecommendationsForScores(tagScores: Record<string, number>): Promise<ContentRecommendation[]> {
    const allRecs = await this.getContentRecommendations();
    return allRecs.filter(rec => {
      const score = tagScores[rec.tag];
      if (score === undefined) return false;
      return score >= (rec.minScore ?? 0) && score <= (rec.maxScore ?? 100);
    });
  }

  async deleteContentRecommendation(id: string): Promise<void> {
    await db.delete(schema.contentRecommendations).where(eq(schema.contentRecommendations.id, id));
  }

  // Recommendation config methods (advanced rules)
  async createRecommendationConfig(config: InsertRecommendationConfig): Promise<RecommendationConfig> {
    const [created] = await db.insert(schema.recommendationConfigs).values(config).returning();
    return created!;
  }

  async getRecommendationConfigs(filters?: { clinicianId?: string; assessmentId?: string; pathwayId?: string; isActive?: boolean }): Promise<RecommendationConfig[]> {
    const conditions = [];
    if (filters?.clinicianId) {
      conditions.push(eq(schema.recommendationConfigs.clinicianUserId, filters.clinicianId));
    }
    if (filters?.assessmentId) {
      conditions.push(eq(schema.recommendationConfigs.assessmentId, filters.assessmentId));
    }
    if (filters?.pathwayId) {
      conditions.push(eq(schema.recommendationConfigs.pathwayId, filters.pathwayId));
    }
    if (filters?.isActive !== undefined) {
      conditions.push(eq(schema.recommendationConfigs.isActive, filters.isActive));
    }
    
    if (conditions.length > 0) {
      return db.select().from(schema.recommendationConfigs).where(and(...conditions)).orderBy(schema.recommendationConfigs.priority);
    }
    return db.select().from(schema.recommendationConfigs).orderBy(schema.recommendationConfigs.priority);
  }

  async getRecommendationConfigById(id: string): Promise<RecommendationConfig | undefined> {
    const [config] = await db.select().from(schema.recommendationConfigs).where(eq(schema.recommendationConfigs.id, id));
    return config;
  }

  async updateRecommendationConfig(id: string, updates: Partial<InsertRecommendationConfig> & { isActive?: boolean }): Promise<RecommendationConfig | undefined> {
    const [updated] = await db.update(schema.recommendationConfigs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.recommendationConfigs.id, id))
      .returning();
    return updated;
  }

  async deleteRecommendationConfig(id: string): Promise<void> {
    await db.delete(schema.recommendationConfigs).where(eq(schema.recommendationConfigs.id, id));
  }

  // Patient recommendation methods (tracking)
  async createPatientRecommendation(rec: InsertPatientRecommendation): Promise<PatientRecommendation> {
    const [created] = await db.insert(schema.patientRecommendations).values(rec).returning();
    return created!;
  }

  async getPatientRecommendations(filters: { clinicianId?: string; patientEmail?: string; source?: string }): Promise<PatientRecommendation[]> {
    const conditions = [];
    if (filters.clinicianId) {
      conditions.push(eq(schema.patientRecommendations.clinicianUserId, filters.clinicianId));
    }
    if (filters.patientEmail) {
      conditions.push(eq(schema.patientRecommendations.patientEmail, filters.patientEmail));
    }
    if (filters.source) {
      conditions.push(eq(schema.patientRecommendations.source, filters.source));
    }
    
    if (conditions.length > 0) {
      return db.select().from(schema.patientRecommendations).where(and(...conditions)).orderBy(desc(schema.patientRecommendations.createdAt));
    }
    return db.select().from(schema.patientRecommendations).orderBy(desc(schema.patientRecommendations.createdAt));
  }

  async getPatientRecommendationById(id: string): Promise<PatientRecommendation | undefined> {
    const [rec] = await db.select().from(schema.patientRecommendations).where(eq(schema.patientRecommendations.id, id));
    return rec;
  }

  async updatePatientRecommendationStatus(id: string, status: string, emailLogId?: string): Promise<void> {
    const updates: any = { status };
    if (emailLogId) {
      updates.sentViaEmailLogId = emailLogId;
    }
    await db.update(schema.patientRecommendations).set(updates).where(eq(schema.patientRecommendations.id, id));
  }

  // Audit log methods
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [created] = await db.insert(schema.auditLogs).values(log).returning();
    return created!;
  }

  async getAuditLogs(filters?: { userId?: string; action?: string; actorType?: string; startDate?: Date; endDate?: Date; limit?: number }): Promise<AuditLog[]> {
    let query = db.select().from(schema.auditLogs);
    
    const conditions = [];
    if (filters?.userId) {
      conditions.push(eq(schema.auditLogs.userId, filters.userId));
    }
    if (filters?.action) {
      conditions.push(eq(schema.auditLogs.action, filters.action));
    }
    if (filters?.actorType) {
      conditions.push(eq(schema.auditLogs.actorType, filters.actorType));
    }
    if (filters?.startDate) {
      conditions.push(gte(schema.auditLogs.createdAt, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(schema.auditLogs.createdAt, filters.endDate));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }
    
    const results = await query.orderBy(desc(schema.auditLogs.createdAt)).limit(filters?.limit ?? 100);
    return results;
  }

  // Patient session methods
  async createPatientSession(sessionData: InsertPatientSession): Promise<PatientSession> {
    const [created] = await db.insert(schema.patientSessions).values(sessionData).returning();
    return created!;
  }

  async getPatientSessionByToken(token: string): Promise<PatientSession | undefined> {
    const [session] = await db.select()
      .from(schema.patientSessions)
      .where(and(
        eq(schema.patientSessions.token, token),
        eq(schema.patientSessions.isActive, true)
      ));
    return session;
  }

  async updatePatientSessionActivity(token: string): Promise<void> {
    await db.update(schema.patientSessions)
      .set({ lastActivity: new Date() })
      .where(eq(schema.patientSessions.token, token));
  }

  async invalidatePatientSession(token: string): Promise<void> {
    await db.update(schema.patientSessions)
      .set({ isActive: false })
      .where(eq(schema.patientSessions.token, token));
  }

  async invalidateExpiredSessions(): Promise<number> {
    const result = await db.update(schema.patientSessions)
      .set({ isActive: false })
      .where(and(
        eq(schema.patientSessions.isActive, true),
        lte(schema.patientSessions.expiresAt, new Date())
      ))
      .returning();
    return result.length;
  }

  // Access code hashing methods
  async hashAccessCode(code: string): Promise<{ hash: string; salt: string }> {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(code, salt, 100000, 64, 'sha512').toString('hex');
    return { hash, salt };
  }

  async verifyAccessCode(code: string, hash: string, salt: string): Promise<boolean> {
    const testHash = crypto.pbkdf2Sync(code, salt, 100000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(testHash));
  }

  async createEmailLogWithHashedCode(log: InsertEmailLog, plainCode: string): Promise<EmailLog> {
    const { hash, salt } = await this.hashAccessCode(plainCode);
    const [created] = await db.insert(schema.emailLogs).values({
      ...log,
      accessCode: plainCode, // Keep plaintext for now during transition
      accessCodeHash: hash,
      accessCodeSalt: salt,
      accessCodeGeneratedAt: new Date(),
    }).returning();
    return created!;
  }

  async getEmailLogByHashedCode(patientEmail: string, plainCode: string): Promise<EmailLog | undefined> {
    // First, try to find by email and verify hash
    const logs = await db.select()
      .from(schema.emailLogs)
      .where(and(
        eq(schema.emailLogs.patientEmail, patientEmail),
        sql`${schema.emailLogs.accessCodeHash} IS NOT NULL`
      ));
    
    for (const log of logs) {
      if (log.accessCodeHash && log.accessCodeSalt) {
        const isValid = await this.verifyAccessCode(plainCode, log.accessCodeHash, log.accessCodeSalt);
        if (isValid) return log;
      }
    }
    
    // Fallback to plaintext check during transition
    const [legacyLog] = await db.select()
      .from(schema.emailLogs)
      .where(and(
        eq(schema.emailLogs.patientEmail, patientEmail),
        eq(schema.emailLogs.accessCode, plainCode)
      ));
    
    return legacyLog;
  }

  // Permission methods (RBAC)
  async getPermissions(): Promise<Permission[]> {
    return await db.select().from(schema.permissions);
  }

  async getPermissionsByRole(role: string): Promise<Permission[]> {
    const results = await db.select({
      permission: schema.permissions
    })
      .from(schema.rolePermissions)
      .innerJoin(schema.permissions, eq(schema.rolePermissions.permissionId, schema.permissions.id))
      .where(eq(schema.rolePermissions.role, role));
    
    return results.map(r => r.permission);
  }

  async createPermission(permission: InsertPermission): Promise<Permission> {
    const [created] = await db.insert(schema.permissions).values(permission).returning();
    return created!;
  }

  async assignPermissionToRole(role: string, permissionId: string): Promise<RolePermission> {
    const [created] = await db.insert(schema.rolePermissions).values({ role, permissionId }).returning();
    return created!;
  }

  async removePermissionFromRole(role: string, permissionId: string): Promise<void> {
    await db.delete(schema.rolePermissions).where(and(
      eq(schema.rolePermissions.role, role),
      eq(schema.rolePermissions.permissionId, permissionId)
    ));
  }

  async hasPermission(role: string, permissionName: string): Promise<boolean> {
    // Admin has all permissions
    if (role === 'admin') return true;
    
    const permissions = await this.getPermissionsByRole(role);
    return permissions.some(p => p.name === permissionName);
  }

  // Data inventory methods
  async getDataInventory(): Promise<DataInventory[]> {
    return await db.select().from(schema.dataInventory).orderBy(schema.dataInventory.dataAssetName);
  }

  async createDataInventoryItem(item: InsertDataInventory): Promise<DataInventory> {
    const [created] = await db.insert(schema.dataInventory).values(item).returning();
    return created!;
  }

  async updateDataInventoryItem(id: string, updates: Partial<InsertDataInventory>): Promise<void> {
    await db.update(schema.dataInventory)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.dataInventory.id, id));
  }

  async deleteDataInventoryItem(id: string): Promise<void> {
    await db.delete(schema.dataInventory).where(eq(schema.dataInventory.id, id));
  }

  // Admin analytics methods
  async getAdminStats(): Promise<{
    totalUsers: number;
    activeSubscriptions: number;
    totalContentSent: number;
    totalAssessments: number;
    recentSignups: number;
    mrr: number;
  }> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [usersResult] = await db.select({ count: count() }).from(schema.users);
    const [activeSubsResult] = await db.select({ count: count() })
      .from(schema.users)
      .where(eq(schema.users.subscriptionStatus, 'active'));
    const [emailsResult] = await db.select({ count: count() }).from(schema.emailLogs);
    const [assessmentsResult] = await db.select({ count: count() }).from(schema.assessmentInvites);
    const [recentSignupsResult] = await db.select({ count: count() })
      .from(schema.users)
      .where(gte(schema.users.createdAt, thirtyDaysAgo));

    const activeSubs = activeSubsResult?.count ?? 0;
    const mrr = Number(activeSubs) * 49; // $49/month per subscription

    return {
      totalUsers: usersResult?.count ?? 0,
      activeSubscriptions: activeSubs,
      totalContentSent: emailsResult?.count ?? 0,
      totalAssessments: assessmentsResult?.count ?? 0,
      recentSignups: recentSignupsResult?.count ?? 0,
      mrr,
    };
  }
}

export const storage = new DatabaseStorage();
