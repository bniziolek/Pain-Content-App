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
  type InsertContentView
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { eq, desc, and } from "drizzle-orm";

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
}

export const storage = new DatabaseStorage();
