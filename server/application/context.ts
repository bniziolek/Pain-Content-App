import type { Request } from "express";
import type { User } from "@shared/schema";
import type { IStorage } from "../storage";

export interface AuditLogger {
  logClinicianAction(
    req: Request,
    user: User,
    action: string,
    options?: Record<string, unknown>
  ): Promise<void>;
  logPatientAction(
    req: Request,
    patientEmail: string,
    action: string,
    options?: Record<string, unknown>
  ): Promise<void>;
  logSystemAction(action: string, options?: Record<string, unknown>): Promise<void>;
}

export interface EmailService {
  sendContentEmail(params: Record<string, unknown>): Promise<{ success: boolean; messageId?: string; error?: string }>;
  sendAssessmentInviteEmail(params: Record<string, unknown>): Promise<{ success: boolean; messageId?: string; error?: string }>;
  sendPasswordResetEmail?(params: Record<string, unknown>): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

export interface CmsService {
  isConfigured(): boolean;
  getAllContent(): Promise<unknown[]>;
  getContentById(id: string): Promise<unknown | null>;
}

export interface PaymentService {
  createCheckoutSession(params: {
    userId: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ url: string }>;
  createPortalSession(params: {
    customerId: string;
    returnUrl: string;
  }): Promise<{ url: string }>;
  getSubscriptionStatus(customerId: string): Promise<{
    status: string;
    currentPeriodEnd?: Date;
  } | null>;
}

export interface AppContext {
  storage: IStorage;
  audit: AuditLogger;
  email: EmailService;
  cms: CmsService;
  payment?: PaymentService;
  now: () => Date;
}
