/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { User } from "@shared/schema";
import type { IStorage } from "../storage";

export interface AuditRequestContext {
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string | null;
}

export type AuditActorType = "clinician" | "admin" | "patient" | "system";
export type AuditOutcome = "success" | "failure" | "denied";

export interface AuditEvent {
  userId?: string;
  actorType: AuditActorType;
  actorEmail?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  phiAccessed?: boolean;
  phiScope?: string;
  details?: Record<string, unknown>;
  sessionId?: string;
  outcome?: AuditOutcome;
}

export interface AuditActionOptions {
  resourceType?: string;
  resourceId?: string;
  phiAccessed?: boolean;
  phiScope?: string;
  details?: Record<string, unknown>;
  outcome?: AuditOutcome;
  sessionId?: string;
}

export interface AuditLogger {
  logAuditEvent(
    request: AuditRequestContext,
    context: AuditEvent
  ): Promise<void>;
  logClinicianAction(
    request: AuditRequestContext,
    user: User,
    action: string,
    options?: AuditActionOptions
  ): Promise<void>;
  logPatientAction(
    request: AuditRequestContext,
    patientEmail: string,
    action: string,
    options?: AuditActionOptions
  ): Promise<void>;
  logSystemAction(action: string, options?: AuditActionOptions): Promise<void>;
}

export interface EmailBrandingConfig {
  logoUrl?: string | null;
  clinicName?: string | null;
  tagline?: string | null;
  primaryColor?: string | null;
  accentColor?: string | null;
  footerText?: string | null;
  showPoweredBy?: boolean;
}

export interface ContentEmailParams {
  toEmail: string;
  subject: string;
  contentItems: Array<{
    title: string;
    summary: string;
    body?: string;
    readTime?: string | null;
    imageUrl?: string | null;
    viewUrl?: string;
  }>;
  providerNote?: string;
  clinicianName?: string;
  branding?: EmailBrandingConfig;
}

export interface AssessmentInviteEmailParams {
  toEmail: string;
  assessmentLink: string;
  clinicianName?: string;
}

export interface PasswordResetEmailParams {
  toEmail: string;
  resetLink: string;
}

export interface EmailService {
  sendContentEmail(params: ContentEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }>;
  sendAssessmentInviteEmail(params: AssessmentInviteEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }>;
  sendPasswordResetEmail?(params: PasswordResetEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

export interface CmsService {
  isConfigured(): boolean;
  getAllContent(): Promise<unknown[]>;
  getContentById(id: string): Promise<unknown | null>;
  getAllPathways?(): Promise<unknown[]>;
  getPathwayById?(id: string): Promise<unknown | null>;
}

export interface PaymentService {
  createCheckoutSession(params: {
    userId: string;
    userEmail: string;
    customerId?: string | null;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ url: string | null; customerId: string; sessionId: string }>;
  createPortalSession(params: {
    customerId: string;
    returnUrl: string;
  }): Promise<{ url: string }>;
  listInvoices(params: {
    customerId: string;
    limit?: number;
  }): Promise<Array<{ id: string; amount: number; status: string | null; date: number; pdfUrl: string | null }>>;
  cancelSubscription(params: { subscriptionId: string; cancelAtPeriodEnd?: boolean }): Promise<void>;
  resumeSubscription(params: { subscriptionId: string }): Promise<void>;
  updateSubscription(params: { subscriptionId: string; newPriceId: string }): Promise<void>;
  getPublishableKey(): Promise<string | undefined>;
  processWebhook(payload: Buffer, signature: string): Promise<void>;
  getSubscriptionStatus(customerId: string): Promise<{
    status: string;
    currentPeriodEnd?: Date;
  } | null>;
  runSync?(options: { webhookUrl?: string }): Promise<void>;
  getSubscription(subscriptionId: string): Promise<any>;
  getPaymentMethods(customerId: string): Promise<any[]>;
  applyCoupon(subscriptionId: string, couponCode: string): Promise<any>;
}

export interface AppContext {
  storage: IStorage;
  audit: AuditLogger;
  email: EmailService;
  cms: CmsService;
  payment?: PaymentService;
  now: () => Date;
}
