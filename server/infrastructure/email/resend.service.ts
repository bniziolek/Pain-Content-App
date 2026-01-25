/**
 * Architecture: Infrastructure layer. Wraps external services (email, Stripe, CMS, audit) behind stable interfaces.
 */

// Resend email service integration
// Using Replit's Resend connector for authentication

import { Resend } from 'resend';
import type { EmailBrandingConfig } from '../../application/context';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('Resend authentication token not found');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  
  return {
    apiKey: connectionSettings.settings.api_key, 
    fromEmail: connectionSettings.settings.from_email
  };
}

async function getResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail
  };
}

export interface ContentEmailData {
  toEmail: string;
  subject: string;
  contentItems: Array<{
    title: string;
    summary: string;
    body: string;
    imageUrl: string | null;
    readTime: string | null;
  }>;
  providerNote?: string;
  clinicianName?: string;
  branding?: EmailBrandingConfig;
}

export interface AssessmentInviteEmailData {
  toEmail: string;
  patientName?: string;
  assessmentLink: string;
  clinicianName?: string;
}

export async function sendContentEmail(data: ContentEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // Check if Resend is configured, otherwise use dev mode logging
  const isConfigured = await isResendConfigured();
  if (!isConfigured) {
    console.log('To:', data.toEmail);
    console.log('Subject:', data.subject);
    console.log('Content Items:', data.contentItems.length);
    data.contentItems.forEach((item, i) => {
      console.log(`  ${i + 1}. ${item.title} (${item.readTime || '5 min'} read)`);
    });
    if (data.providerNote) console.log('Provider Note:', data.providerNote);
    if (data.branding) console.log('Branding:', data.branding.clinicName || 'Default');
    return { success: true, messageId: 'dev-mode-' + Date.now() };
  }

  try {
    const { client, fromEmail } = await getResendClient();
    
    const branding = data.branding;
    const primaryColor = branding?.primaryColor || '#0f766e';
    const headerName = branding?.clinicName || 'DriverPath';
    const tagline = branding?.tagline || 'Educational Content for Your Recovery';
    const showPoweredBy = branding?.showPoweredBy !== false;
    
    const contentHtml = data.contentItems.map(item => `
      <div style="margin-bottom: 24px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
        ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.title}" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 4px; margin-bottom: 12px;" />` : ''}
        <h2 style="margin: 0 0 8px 0; color: ${primaryColor}; font-size: 20px;">${item.title}</h2>
        <p style="margin: 0 0 12px 0; color: #666; font-size: 14px;">${item.readTime || '5 min'} read</p>
        <p style="margin: 0; color: #333; line-height: 1.6;">${item.summary}</p>
      </div>
    `).join('');

    const headerHtml = branding?.logoUrl 
      ? `<img src="${branding.logoUrl}" alt="${headerName}" style="max-height: 60px; max-width: 200px; margin-bottom: 8px;" />`
      : `<h1 style="color: ${primaryColor}; font-size: 24px; margin: 0;">${headerName}</h1>`;
    
    const footerHtml = branding?.footerText 
      ? branding.footerText 
      : (showPoweredBy 
          ? (branding?.clinicName 
              ? `Powered by DriverPath` 
              : 'This content was shared with you by your healthcare provider through DriverPath.')
          : '');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
          <div style="text-align: center; margin-bottom: 32px;">
            ${headerHtml}
            <p style="color: #666; margin: 8px 0 0 0;">${tagline}</p>
          </div>
          
          ${data.providerNote ? `
            <div style="background: #e0f2fe; padding: 16px; border-radius: 8px; margin-bottom: 24px; border-left: 4px solid ${primaryColor};">
              <p style="margin: 0; color: #0369a1; font-style: italic;">"${data.providerNote}"</p>
              ${data.clinicianName ? `<p style="margin: 8px 0 0 0; color: #0369a1; font-size: 14px;">— ${data.clinicianName}</p>` : ''}
            </div>
          ` : ''}
          
          <h2 style="color: ${primaryColor}; font-size: 18px; margin-bottom: 16px;">Your Educational Materials</h2>
          
          ${contentHtml}
          
          ${footerHtml ? `
            <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0;" />
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              ${footerHtml}
            </p>
          ` : ''}
        </body>
      </html>
    `;

    const result = await client.emails.send({
      from: fromEmail,
      to: data.toEmail,
      subject: data.subject,
      html
    });

    console.log('[Resend] Email sent successfully:', result);
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('[Resend] Failed to send email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function sendAssessmentInviteEmail(data: AssessmentInviteEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // Check if Resend is configured, otherwise use dev mode logging
  const isConfigured = await isResendConfigured();
  if (!isConfigured) {
    console.log('To:', data.toEmail);
    console.log('Assessment Link:', data.assessmentLink);
    if (data.clinicianName) console.log('From Clinician:', data.clinicianName);
    return { success: true, messageId: 'dev-mode-' + Date.now() };
  }

  try {
    const { client, fromEmail } = await getResendClient();

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #0f766e; font-size: 24px; margin: 0;">DriverPath</h1>
            <p style="color: #666; margin: 8px 0 0 0;">Health Assessment</p>
          </div>
          
          <div style="background: #f0fdf4; padding: 24px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
            <h2 style="color: #166534; margin: 0 0 12px 0;">You've Been Invited to Complete an Assessment</h2>
            <p style="color: #333; margin: 0 0 20px 0;">
              ${data.clinicianName ? `${data.clinicianName} has` : 'Your healthcare provider has'} invited you to complete a brief health assessment. 
              This will help personalize your care and identify the best educational resources for your recovery.
            </p>
            <a href="${data.assessmentLink}" style="display: inline-block; background: #0f766e; color: white; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600;">
              Start Assessment
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; text-align: center;">
            This assessment typically takes 5-10 minutes to complete.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0;" />
          
          <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
            If you didn't expect this email, you can safely ignore it.
          </p>
        </body>
      </html>
    `;

    const result = await client.emails.send({
      from: fromEmail,
      to: data.toEmail,
      subject: `${data.clinicianName ? `${data.clinicianName} has` : 'Your healthcare provider has'} invited you to complete a health assessment`,
      html
    });

    console.log('[Resend] Assessment invite sent successfully:', result);
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('[Resend] Failed to send assessment invite:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function isResendConfigured(): Promise<boolean> {
  try {
    await getCredentials();
    return true;
  } catch {
    return false;
  }
}
