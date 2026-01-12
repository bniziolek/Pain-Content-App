import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-mail',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Gmail not connected');
  }
  return accessToken;
}

async function getUncachableGmailClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

export async function isGmailConfigured(): Promise<boolean> {
  try {
    const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
    return !!hostname;
  } catch {
    return false;
  }
}

function createEmail(to: string, subject: string, htmlContent: string): string {
  const email = [
    'Content-Type: text/html; charset="UTF-8"',
    'MIME-Version: 1.0',
    `To: ${to}`,
    `Subject: ${subject}`,
    '',
    htmlContent
  ].join('\r\n');
  
  return Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

interface ContentEmailData {
  toEmail: string;
  subject: string;
  contentItems: { title: string; summary: string; readTime?: string | null; imageUrl?: string | null; viewUrl: string }[];
  providerNote?: string;
  clinicianName?: string;
}

interface PatientPortalEmailData {
  toEmail: string;
  subject: string;
  accessCode: string;
  portalUrl: string;
  contentCount: number;
  providerNote?: string;
  clinicianName?: string;
}

interface AssessmentInviteEmailData {
  toEmail: string;
  assessmentLink: string;
  clinicianName?: string;
}

export async function sendContentEmail(data: ContentEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const isConfigured = await isGmailConfigured();
  if (!isConfigured) {
    console.log('\n========== DEV MODE: EMAIL WOULD BE SENT ==========');
    console.log('To:', data.toEmail);
    console.log('Subject:', data.subject);
    console.log('Content Items:', data.contentItems.length);
    data.contentItems.forEach((item, i) => {
      console.log(`  ${i + 1}. ${item.title} (${item.readTime || '5 min'} read)`);
      console.log(`      View URL: ${item.viewUrl}`);
    });
    if (data.providerNote) console.log('Provider Note:', data.providerNote);
    console.log('===================================================\n');
    return { success: true, messageId: 'dev-mode-' + Date.now() };
  }

  try {
    const gmail = await getUncachableGmailClient();
    
    const contentHtml = data.contentItems.map(item => `
      <div style="margin-bottom: 16px; padding: 20px; background: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef;">
        <a href="${item.viewUrl}" style="color: #1a5653; text-decoration: none; font-size: 18px; font-weight: 600; display: block; margin-bottom: 8px;">
          ${item.title}
        </a>
        <p style="color: #666; margin: 0 0 12px 0; font-size: 14px; line-height: 1.5;">
          Click the title above to read this educational content.
        </p>
        <div style="display: flex; align-items: center; gap: 16px;">
          <span style="color: #888; font-size: 12px;">${item.readTime || '5 min'} read</span>
          <a href="${item.viewUrl}" style="color: #1a5653; font-size: 13px; font-weight: 500; text-decoration: underline;">
            Read Now &rarr;
          </a>
        </div>
      </div>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #1a5653; margin: 0;">DriverPath</h1>
          <p style="color: #666; margin: 4px 0 0 0;">Patient Education Resources</p>
        </div>
        
        ${data.clinicianName ? `<p style="margin-bottom: 20px;">Your healthcare provider <strong>${data.clinicianName}</strong> has shared the following educational content with you:</p>` : '<p style="margin-bottom: 20px;">Your healthcare provider has shared the following educational content with you:</p>'}
        
        ${data.providerNote ? `
          <div style="background: #e8f5f3; border-left: 4px solid #1a5653; padding: 12px 16px; margin-bottom: 24px; border-radius: 0 4px 4px 0;">
            <strong>Note from your provider:</strong><br/>
            ${data.providerNote}
          </div>
        ` : ''}
        
        ${contentHtml}
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #888; font-size: 12px; text-align: center;">
          This email was sent via DriverPath, a patient education platform for healthcare providers.
        </p>
      </body>
      </html>
    `;

    const encodedEmail = createEmail(data.toEmail, data.subject, html);
    
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail
      }
    });

    return { success: true, messageId: response.data.id || undefined };
  } catch (error) {
    console.error('[Gmail] Error sending content email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function sendAssessmentInviteEmail(data: AssessmentInviteEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const isConfigured = await isGmailConfigured();
  if (!isConfigured) {
    console.log('\n========== DEV MODE: ASSESSMENT INVITE EMAIL ==========');
    console.log('To:', data.toEmail);
    console.log('Assessment Link:', data.assessmentLink);
    if (data.clinicianName) console.log('From Clinician:', data.clinicianName);
    console.log('========================================================\n');
    return { success: true, messageId: 'dev-mode-' + Date.now() };
  }

  try {
    const gmail = await getUncachableGmailClient();

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #1a5653; margin: 0;">DriverPath</h1>
          <p style="color: #666; margin: 4px 0 0 0;">Patient Assessment</p>
        </div>
        
        ${data.clinicianName ? `<p>Your healthcare provider <strong>${data.clinicianName}</strong> has invited you to complete a brief health assessment.</p>` : '<p>Your healthcare provider has invited you to complete a brief health assessment.</p>'}
        
        <p>This assessment will help us better understand your health needs and provide you with personalized educational resources.</p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${data.assessmentLink}" style="background: #1a5653; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">Start Assessment</a>
        </div>
        
        <p style="color: #666; font-size: 14px;">If the button above doesn't work, copy and paste this link into your browser:</p>
        <p style="color: #1a5653; font-size: 14px; word-break: break-all;">${data.assessmentLink}</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #888; font-size: 12px; text-align: center;">
          This email was sent via DriverPath, a patient education platform for healthcare providers.
        </p>
      </body>
      </html>
    `;

    const subject = data.clinicianName 
      ? `${data.clinicianName} has invited you to complete a health assessment`
      : 'You have been invited to complete a health assessment';

    const encodedEmail = createEmail(data.toEmail, subject, html);
    
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail
      }
    });

    return { success: true, messageId: response.data.id || undefined };
  } catch (error) {
    console.error('[Gmail] Error sending assessment invite:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

interface PasswordResetEmailData {
  toEmail: string;
  resetLink: string;
}

export async function sendPasswordResetEmail(data: PasswordResetEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const isConfigured = await isGmailConfigured();
  if (!isConfigured) {
    console.log('\n========== DEV MODE: PASSWORD RESET EMAIL ==========');
    console.log('To:', data.toEmail);
    console.log('Reset Link:', data.resetLink);
    console.log('=====================================================\n');
    return { success: true, messageId: 'dev-mode-' + Date.now() };
  }

  try {
    const gmail = await getUncachableGmailClient();

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #1a5653; margin: 0;">DriverPath</h1>
          <p style="color: #666; margin: 4px 0 0 0;">Password Reset</p>
        </div>
        
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${data.resetLink}" style="background: #1a5653; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">Reset Password</a>
        </div>
        
        <p style="color: #666; font-size: 14px;">This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
        
        <p style="color: #666; font-size: 14px;">If the button above doesn't work, copy and paste this link into your browser:</p>
        <p style="color: #1a5653; font-size: 14px; word-break: break-all;">${data.resetLink}</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #888; font-size: 12px; text-align: center;">
          This email was sent via DriverPath, a patient education platform for healthcare providers.
        </p>
      </body>
      </html>
    `;

    const encodedEmail = createEmail(data.toEmail, 'Reset your DriverPath password', html);
    
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail
      }
    });

    return { success: true, messageId: response.data.id || undefined };
  } catch (error) {
    console.error('[Gmail] Error sending password reset email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function sendPatientPortalEmail(data: PatientPortalEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const isConfigured = await isGmailConfigured();
  if (!isConfigured) {
    console.log('\n========== DEV MODE: PATIENT PORTAL EMAIL ==========');
    console.log('To:', data.toEmail);
    console.log('Subject:', data.subject);
    console.log('Access Code:', data.accessCode);
    console.log('Portal URL:', data.portalUrl);
    console.log('Content Count:', data.contentCount);
    if (data.providerNote) console.log('Provider Note:', data.providerNote);
    console.log('=====================================================\n');
    return { success: true, messageId: 'dev-mode-' + Date.now() };
  }

  try {
    const gmail = await getUncachableGmailClient();

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #1a5653; margin: 0;">DriverPath</h1>
          <p style="color: #666; margin: 4px 0 0 0;">Patient Education Portal</p>
        </div>
        
        ${data.clinicianName ? `<p style="margin-bottom: 20px;">Your healthcare provider <strong>${data.clinicianName}</strong> has shared ${data.contentCount} educational resource${data.contentCount !== 1 ? 's' : ''} with you.</p>` : `<p style="margin-bottom: 20px;">Your healthcare provider has shared ${data.contentCount} educational resource${data.contentCount !== 1 ? 's' : ''} with you.</p>`}
        
        ${data.providerNote ? `
          <div style="background: #e8f5f3; border-left: 4px solid #1a5653; padding: 12px 16px; margin-bottom: 24px; border-radius: 0 4px 4px 0;">
            <strong>Note from your provider:</strong><br/>
            ${data.providerNote}
          </div>
        ` : ''}
        
        <div style="background: #f8f9fa; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
          <p style="margin: 0 0 12px 0; color: #666; font-size: 14px;">Your secure access code:</p>
          <div style="background: white; border: 2px solid #1a5653; border-radius: 8px; padding: 16px 24px; display: inline-block;">
            <span style="font-family: 'SF Mono', Monaco, monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1a5653;">${data.accessCode}</span>
          </div>
          <p style="margin: 16px 0 0 0; color: #888; font-size: 12px;">Keep this code private. Do not share it with anyone.</p>
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${data.portalUrl}" style="background: #1a5653; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">View Your Content</a>
        </div>
        
        <p style="color: #666; font-size: 14px; text-align: center;">You'll need to enter your email address and the access code above to view your content.</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #888; font-size: 12px; text-align: center;">
          This email was sent via DriverPath, a patient education platform for healthcare providers.
        </p>
      </body>
      </html>
    `;

    const encodedEmail = createEmail(data.toEmail, data.subject, html);
    
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail
      }
    });

    return { success: true, messageId: response.data.id || undefined };
  } catch (error) {
    console.error('[Gmail] Error sending patient portal email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
