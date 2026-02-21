/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { EmailLog, User } from "@shared/schema";
import type { AppContext, AuditRequestContext, EmailBrandingConfig } from "../context";
import { createSecureAccessCode } from "../../domain/messaging";
import { insertEmailLogSchema } from "@shared/schema";

export interface SendContentEmailInput {
  clinician: User;
  patientEmail: string;
  subject: string;
  contentIds: string[];
  providerNote?: string;
  type?: string;
}

export interface SendContentEmailResult {
  emailLog: EmailLog;
  accessCode: string;
}

export async function sendContentEmailFlow(
  ctx: AppContext,
  auditContext: AuditRequestContext,
  input: SendContentEmailInput
): Promise<SendContentEmailResult> {
  const { accessCode, accessCodeHash, accessCodeSalt } = createSecureAccessCode();
  
  const data = insertEmailLogSchema.parse({
    clinicianUserId: input.clinician.id,
    patientEmail: input.patientEmail,
    subject: input.subject,
    contentIds: input.contentIds,
    providerNote: input.providerNote,
    type: input.type || 'content_bundle',
    accessCodeHash,
    accessCodeSalt,
    accessCodeGeneratedAt: ctx.now(),
  });
  
  const emailLog = await ctx.storage.createEmailLog(data);
  
  const contentItems = (await Promise.all(
    input.contentIds.map((id: string) => ctx.storage.getContentById(id))
  )).filter((item): item is NonNullable<typeof item> => !!item && item.moderationStatus === 'approved');
  
  // Fetch branding for Pro/Enterprise users with active subscriptions
  let branding: EmailBrandingConfig | undefined;
  const clinicianTier = input.clinician.subscriptionTier || 'basic';
  const clinicianStatus = input.clinician.subscriptionStatus || 'inactive';
  const hasBrandingAccess = (clinicianTier === 'pro' || clinicianTier === 'enterprise') && clinicianStatus === 'active';
  
  if (hasBrandingAccess) {
    const clinicBranding = await ctx.storage.getClinicBranding(input.clinician.id);
    if (clinicBranding && clinicBranding.isActive) {
      branding = {
        logoUrl: clinicBranding.logoUrl,
        clinicName: clinicBranding.clinicName,
        tagline: clinicBranding.tagline,
        primaryColor: clinicBranding.primaryColor,
        accentColor: clinicBranding.accentColor,
        footerText: clinicBranding.footerText,
        showPoweredBy: clinicBranding.showPoweredBy !== false,
      };
    }
  }
  
  const baseUrl = process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000';
  const contentItemsWithUrls = contentItems.map((item: any) => ({
    title: item.title,
    summary: item.summary || '',
    readTime: item.readTime,
    imageUrl: item.imageUrl,
    viewUrl: `${baseUrl}/view/${emailLog.id}?content=${item.id}`,
  }));
  
  await ctx.email.sendContentEmail({
    toEmail: input.patientEmail,
    subject: input.subject,
    contentItems: contentItemsWithUrls,
    providerNote: input.providerNote,
    branding,
    clinicianName: input.clinician.name || undefined,
  });
  
  await ctx.audit.logClinicianAction(auditContext, input.clinician, 'email_sent', {
    resourceType: 'email_log',
    resourceId: emailLog.id,
    phiAccessed: true,
    phiScope: 'patient email, content bundle',
    details: { 
      patientEmail: input.patientEmail, 
      contentCount: input.contentIds.length,
      customBranding: !!branding,
    },
  });
  
  return { emailLog, accessCode };
}
