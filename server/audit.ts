import { storage } from "./storage";
import type { Request } from "express";
import type { User } from "@shared/schema";

export type AuditAction = 
  | 'login' 
  | 'logout' 
  | 'login_failed' 
  | 'content_access' 
  | 'phi_view' 
  | 'phi_export' 
  | 'email_sent' 
  | 'settings_change' 
  | 'user_create' 
  | 'user_update' 
  | 'user_delete'
  | 'password_change' 
  | 'session_timeout'
  | 'patient_portal_access'
  | 'patient_portal_auth'
  | 'patient_portal_auth_failed'
  | 'assessment_submit'
  | 'content_view'
  | 'permission_denied';

export type ActorType = 'clinician' | 'admin' | 'patient' | 'system';
export type ResourceType = 'patient' | 'content' | 'assessment' | 'email_log' | 'user' | 'session';
export type Outcome = 'success' | 'failure' | 'denied';

export interface AuditContext {
  userId?: string;
  actorType: ActorType;
  actorEmail?: string;
  action: AuditAction;
  resourceType?: ResourceType;
  resourceId?: string;
  phiAccessed?: boolean;
  phiScope?: string;
  details?: Record<string, unknown>;
  sessionId?: string;
  outcome?: Outcome;
}

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded)) {
    return forwarded[0];
  }
  return req.socket?.remoteAddress || 'unknown';
}

function getUserAgent(req: Request): string {
  return req.headers['user-agent'] || 'unknown';
}

export async function logAuditEvent(
  req: Request,
  context: AuditContext
): Promise<void> {
  try {
    await storage.createAuditLog({
      userId: context.userId || null,
      actorType: context.actorType,
      actorEmail: context.actorEmail,
      action: context.action,
      resourceType: context.resourceType,
      resourceId: context.resourceId,
      phiAccessed: context.phiAccessed || false,
      phiScope: context.phiScope,
      details: context.details,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      sessionId: context.sessionId || req.sessionID,
      outcome: context.outcome || 'success',
    });
  } catch (error) {
    console.error('[Audit] Failed to create audit log:', error);
  }
}

export async function logClinicianAction(
  req: Request,
  user: User,
  action: AuditAction,
  options?: {
    resourceType?: ResourceType;
    resourceId?: string;
    phiAccessed?: boolean;
    phiScope?: string;
    details?: Record<string, unknown>;
    outcome?: Outcome;
  }
): Promise<void> {
  await logAuditEvent(req, {
    userId: user.id,
    actorType: user.role === 'admin' ? 'admin' : 'clinician',
    actorEmail: user.email,
    action,
    resourceType: options?.resourceType,
    resourceId: options?.resourceId,
    phiAccessed: options?.phiAccessed,
    phiScope: options?.phiScope,
    details: options?.details,
    sessionId: req.sessionID,
    outcome: options?.outcome || 'success',
  });
}

export async function logPatientAction(
  req: Request,
  patientEmail: string,
  action: AuditAction,
  options?: {
    resourceType?: ResourceType;
    resourceId?: string;
    phiAccessed?: boolean;
    phiScope?: string;
    details?: Record<string, unknown>;
    sessionId?: string;
    outcome?: Outcome;
  }
): Promise<void> {
  await logAuditEvent(req, {
    actorType: 'patient',
    actorEmail: patientEmail,
    action,
    resourceType: options?.resourceType,
    resourceId: options?.resourceId,
    phiAccessed: options?.phiAccessed,
    phiScope: options?.phiScope,
    details: options?.details,
    sessionId: options?.sessionId,
    outcome: options?.outcome || 'success',
  });
}

export async function logSystemAction(
  action: AuditAction,
  options?: {
    resourceType?: ResourceType;
    resourceId?: string;
    details?: Record<string, unknown>;
    outcome?: Outcome;
  }
): Promise<void> {
  try {
    await storage.createAuditLog({
      userId: null,
      actorType: 'system',
      actorEmail: null,
      action,
      resourceType: options?.resourceType,
      resourceId: options?.resourceId,
      phiAccessed: false,
      phiScope: null,
      details: options?.details,
      ipAddress: 'system',
      userAgent: 'system',
      sessionId: null,
      outcome: options?.outcome || 'success',
    });
  } catch (error) {
    console.error('[Audit] Failed to create system audit log:', error);
  }
}
