/**
 * Architecture: Infrastructure layer. Wraps external services (email, Stripe, CMS, audit) behind stable interfaces.
 */

import {
  sendContentEmail as sendGmailContent,
  sendAssessmentInviteEmail as sendGmailAssessmentInvite,
  sendPasswordResetEmail as sendGmailPasswordReset,
  isGmailConfigured,
} from './gmail.service';

import {
  sendContentEmail as sendResendContent,
  sendAssessmentInviteEmail as sendResendAssessmentInvite,
  isResendConfigured,
} from './resend.service';
import { storage } from '../../storage';

export type EmailProvider = 'gmail' | 'resend' | 'auto';

async function recordEmailMetric(success: boolean, errorReason?: string): Promise<void> {
  // Can be disabled via DISABLE_HEALTH_METRICS env var
  if (process.env.DISABLE_HEALTH_METRICS === 'true') {
    return;
  }
  
  try {
    await storage.recordHealthMetric({
      metricType: success ? 'email_sent' : 'email_bounced',
      metricName: 'email_delivery',
      value: 1,
      status: success ? 'success' : 'error',
      metadata: success ? undefined : { reason: errorReason },
    });
  } catch (err) {
    console.error('Failed to record email health metric:', err);
  }
}

export interface ContentEmailData {
  toEmail: string;
  subject: string;
  contentItems: { 
    title: string; 
    summary: string; 
    body?: string;
    readTime?: string | null; 
    imageUrl?: string | null; 
    viewUrl?: string;
  }[];
  providerNote?: string;
  clinicianName?: string;
}

export interface AssessmentInviteEmailData {
  toEmail: string;
  assessmentLink: string;
  clinicianName?: string;
}

export interface PasswordResetEmailData {
  toEmail: string;
  resetLink: string;
}

export interface EmailAdapterConfig {
  preferredProvider: EmailProvider;
}

const defaultConfig: EmailAdapterConfig = {
  preferredProvider: 'auto',
};

let currentConfig: EmailAdapterConfig = { ...defaultConfig };

export function configureEmailAdapter(config: Partial<EmailAdapterConfig>): void {
  currentConfig = { ...currentConfig, ...config };
}

export function getEmailAdapterConfig(): EmailAdapterConfig {
  return { ...currentConfig };
}

async function resolveProvider(): Promise<'gmail' | 'resend' | null> {
  if (currentConfig.preferredProvider === 'gmail') {
    const configured = await isGmailConfigured();
    return configured ? 'gmail' : null;
  }
  
  if (currentConfig.preferredProvider === 'resend') {
    const configured = await isResendConfigured();
    return configured ? 'resend' : null;
  }
  
  const gmailConfigured = await isGmailConfigured();
  if (gmailConfigured) return 'gmail';
  
  const resendConfigured = await isResendConfigured();
  if (resendConfigured) return 'resend';
  
  return null;
}

export async function sendContentEmail(
  data: ContentEmailData
): Promise<{ success: boolean; messageId?: string; error?: string; provider?: string }> {
  const provider = await resolveProvider();
  
  if (!provider) {
    console.log('[EmailAdapter] No email provider configured, logging email:');
    console.log('To:', data.toEmail);
    console.log('Subject:', data.subject);
    await recordEmailMetric(true);
    return { success: true, messageId: 'dev-mode-' + Date.now(), provider: 'console' };
  }
  
  if (provider === 'gmail') {
    const gmailData = {
      ...data,
      contentItems: data.contentItems.map(item => ({
        ...item,
        viewUrl: item.viewUrl || '',
      })),
    };
    const result = await sendGmailContent(gmailData);
    await recordEmailMetric(result.success, result.error);
    return { ...result, provider: 'gmail' };
  }
  
  const resendData = {
    ...data,
    contentItems: data.contentItems.map(item => ({
      title: item.title,
      summary: item.summary,
      body: item.body || item.summary,
      imageUrl: item.imageUrl ?? null,
      readTime: item.readTime ?? null,
    })),
  };
  const result = await sendResendContent(resendData);
  await recordEmailMetric(result.success, result.error);
  return { ...result, provider: 'resend' };
}

export async function sendAssessmentInviteEmail(
  data: AssessmentInviteEmailData
): Promise<{ success: boolean; messageId?: string; error?: string; provider?: string }> {
  const provider = await resolveProvider();
  
  if (!provider) {
    console.log('[EmailAdapter] No email provider configured, logging email:');
    console.log('To:', data.toEmail);
    console.log('Assessment Link:', data.assessmentLink);
    await recordEmailMetric(true);
    return { success: true, messageId: 'dev-mode-' + Date.now(), provider: 'console' };
  }
  
  if (provider === 'gmail') {
    const result = await sendGmailAssessmentInvite(data);
    await recordEmailMetric(result.success, result.error);
    return { ...result, provider: 'gmail' };
  }
  
  const result = await sendResendAssessmentInvite(data);
  await recordEmailMetric(result.success, result.error);
  return { ...result, provider: 'resend' };
}

export async function sendPasswordResetEmail(
  data: PasswordResetEmailData
): Promise<{ success: boolean; messageId?: string; error?: string; provider?: string }> {
  const provider = await resolveProvider();
  
  if (!provider) {
    console.log('[EmailAdapter] No email provider configured, logging email:');
    console.log('To:', data.toEmail);
    console.log('Reset Link:', data.resetLink);
    await recordEmailMetric(true);
    return { success: true, messageId: 'dev-mode-' + Date.now(), provider: 'console' };
  }
  
  if (provider === 'gmail') {
    const result = await sendGmailPasswordReset(data);
    await recordEmailMetric(result.success, result.error);
    return { ...result, provider: 'gmail' };
  }
  
  await recordEmailMetric(false, 'Password reset email not supported by Resend provider');
  return { 
    success: false, 
    error: 'Password reset email not supported by Resend provider',
    provider: 'resend' 
  };
}

export async function getConfiguredProvider(): Promise<'gmail' | 'resend' | null> {
  return resolveProvider();
}
