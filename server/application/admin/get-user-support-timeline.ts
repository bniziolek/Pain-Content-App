/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 * Provides activity timeline for user support dashboard.
 */

import type { AppContext } from "../context";

export interface GetUserSupportTimelineInput {
  userId: string;
  days?: number;
}

export interface TimelineEvent {
  id: string;
  type: 'login' | 'login_failed' | 'content_sent' | 'assessment' | 'subscription' | 'admin_action' | 'error' | 'other';
  action: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
  severity: 'info' | 'warning' | 'error' | 'success';
}

export interface UserSupportTimeline {
  events: TimelineEvent[];
  totalCount: number;
}

const ACTION_TYPE_MAP: Record<string, TimelineEvent['type']> = {
  'login': 'login',
  'logout': 'login',
  'login_failed': 'login_failed',
  'email_sent': 'content_sent',
  'content_access': 'content_sent',
  'assessment_created': 'assessment',
  'assessment_completed': 'assessment',
  'subscription_created': 'subscription',
  'subscription_updated': 'subscription',
  'subscription_cancelled': 'subscription',
  'payment_succeeded': 'subscription',
  'payment_failed': 'subscription',
  'user_create': 'admin_action',
  'user_update': 'admin_action',
  'password_change': 'admin_action',
  'settings_change': 'admin_action',
  'account_unlocked': 'admin_action',
};

const ACTION_SEVERITY_MAP: Record<string, TimelineEvent['severity']> = {
  'login': 'info',
  'logout': 'info',
  'login_failed': 'warning',
  'email_sent': 'success',
  'content_access': 'info',
  'assessment_created': 'success',
  'assessment_completed': 'success',
  'subscription_created': 'success',
  'subscription_updated': 'info',
  'subscription_cancelled': 'warning',
  'payment_succeeded': 'success',
  'payment_failed': 'error',
  'user_create': 'info',
  'user_update': 'info',
  'password_change': 'warning',
  'settings_change': 'info',
  'account_unlocked': 'success',
};

function getActionDescription(action: string, details?: Record<string, unknown>): string {
  const descriptions: Record<string, string> = {
    'login': 'User logged in',
    'logout': 'User logged out',
    'login_failed': 'Failed login attempt',
    'email_sent': 'Content email sent to patient',
    'content_access': 'Content was accessed',
    'assessment_created': 'Assessment was created',
    'assessment_completed': 'Assessment was completed',
    'subscription_created': 'Subscription started',
    'subscription_updated': 'Subscription was updated',
    'subscription_cancelled': 'Subscription was cancelled',
    'payment_succeeded': 'Payment was successful',
    'payment_failed': 'Payment failed',
    'user_create': 'User account was created',
    'user_update': 'User account was updated',
    'password_change': 'Password was changed',
    'settings_change': 'Settings were modified',
    'account_unlocked': 'Account was unlocked by admin',
  };
  
  let desc = descriptions[action] || `Action: ${action}`;
  
  if (details?.phiScope) {
    desc += ` (${details.phiScope})`;
  }
  
  return desc;
}

export async function getUserSupportTimeline(
  ctx: AppContext,
  input: GetUserSupportTimelineInput
): Promise<UserSupportTimeline> {
  const days = input.days || 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const auditLogs = await ctx.storage.getAuditLogs({
    userId: input.userId,
    startDate,
    limit: 100,
  });

  const events: TimelineEvent[] = auditLogs.map(log => ({
    id: log.id,
    type: ACTION_TYPE_MAP[log.action] || 'other',
    action: log.action,
    description: getActionDescription(log.action, log.details as Record<string, unknown> | undefined),
    timestamp: log.createdAt ? new Date(log.createdAt).toISOString() : new Date().toISOString(),
    metadata: log.details as Record<string, unknown> | undefined,
    severity: ACTION_SEVERITY_MAP[log.action] || 'info',
  }));

  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return {
    events,
    totalCount: events.length,
  };
}
