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
  type InsertAuditLog
} from "@shared/schema";
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

  // Content
  getAllContent(): Promise<ContentItem[]>;
  getContentById(id: string): Promise<ContentItem | undefined>;
  createContent(content: InsertContentItem): Promise<ContentItem>;
  updateContent(id: string, content: Partial<InsertContentItem>): Promise<ContentItem | undefined>;
  deleteContent(id: string): Promise<void>;

  // Assessments
  getDefaultAssessment(): Promise<Assessment | undefined>;
  createAssessmentInvite(invite: InsertAssessmentInvite): Promise<AssessmentInvite>;
  getAssessmentInvitesByClinicianId(clinicianId: string): Promise<AssessmentInvite[]>;
  getAssessmentInvitesByPatientEmail(clinicianId: string, patientEmail: string): Promise<AssessmentInvite[]>;
  getAssessmentInviteByToken(token: string): Promise<AssessmentInvite | undefined>;
  updateAssessmentInviteStatus(id: string, status: string, completedAt?: Date): Promise<void>;

  // Internal screenings
  createInternalScreening(screening: InsertInternalScreening): Promise<InternalScreening>;
  getInternalScreeningsByClinicianId(clinicianId: string): Promise<InternalScreening[]>;

  // Email logs
  createEmailLog(log: InsertEmailLog): Promise<EmailLog>;
  getEmailLogsByClinicianId(clinicianId: string): Promise<EmailLog[]>;
  getEmailLogsByPatientEmail(clinicianId: string, patientEmail: string): Promise<EmailLog[]>;
  updateEmailLogStatus(id: string, status: string): Promise<void>;

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
  updateFollowUpRule(id: string, updates: Partial<InsertFollowUpRule> & { isActive?: boolean }): Promise<void>;
  deleteFollowUpRule(id: string): Promise<void>;

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

  // Content recommendations
  createContentRecommendation(rec: InsertContentRecommendation): Promise<ContentRecommendation>;
  getContentRecommendations(): Promise<ContentRecommendation[]>;
  getRecommendationsForScores(tagScores: Record<string, number>): Promise<ContentRecommendation[]>;
  deleteContentRecommendation(id: string): Promise<void>;

  // Audit logs
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(filters?: { userId?: string; action?: string; limit?: number }): Promise<AuditLog[]>;

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
    const [assessment] = await db.select().from(schema.assessments).limit(1);
    return assessment;
  }

  async createAssessmentInvite(invite: InsertAssessmentInvite): Promise<AssessmentInvite> {
    const token = crypto.randomUUID();
    const [created] = await db.insert(schema.assessmentInvites)
      .values({ ...invite, token })
      .returning();
    return created!;
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

  async updateEmailLogStatus(id: string, status: string): Promise<void> {
    await db.update(schema.emailLogs)
      .set({ status })
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

  // Audit log methods
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [created] = await db.insert(schema.auditLogs).values(log).returning();
    return created!;
  }

  async getAuditLogs(filters?: { userId?: string; action?: string; limit?: number }): Promise<AuditLog[]> {
    let query = db.select().from(schema.auditLogs);
    
    if (filters?.userId) {
      query = query.where(eq(schema.auditLogs.userId, filters.userId)) as typeof query;
    }
    if (filters?.action) {
      query = query.where(eq(schema.auditLogs.action, filters.action)) as typeof query;
    }
    
    const results = await query.orderBy(desc(schema.auditLogs.createdAt)).limit(filters?.limit ?? 100);
    return results;
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
