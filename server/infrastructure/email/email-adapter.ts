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

export type EmailProvider = 'gmail' | 'resend' | 'auto';

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
    return { success: true, messageId: 'dev-mode-' + Date.now(), provider: 'console' };
  }
  
  if (provider === 'gmail') {
    const result = await sendGmailAssessmentInvite(data);
    return { ...result, provider: 'gmail' };
  }
  
  const result = await sendResendAssessmentInvite(data);
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
    return { success: true, messageId: 'dev-mode-' + Date.now(), provider: 'console' };
  }
  
  if (provider === 'gmail') {
    const result = await sendGmailPasswordReset(data);
    return { ...result, provider: 'gmail' };
  }
  
  return { 
    success: false, 
    error: 'Password reset email not supported by Resend provider',
    provider: 'resend' 
  };
}

export async function getConfiguredProvider(): Promise<'gmail' | 'resend' | null> {
  return resolveProvider();
}
