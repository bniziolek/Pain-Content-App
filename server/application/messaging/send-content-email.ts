import type { Request } from "express";
import type { EmailLog, User } from "@shared/schema";
import type { AppContext } from "../context";
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
  req: Request,
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
  )).filter(Boolean);
  
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
  });
  
  await ctx.audit.logClinicianAction(req, input.clinician, 'email_sent', {
    resourceType: 'email_log',
    resourceId: emailLog.id,
    phiAccessed: true,
    phiScope: 'patient email, content bundle',
    details: { patientEmail: input.patientEmail, contentCount: input.contentIds.length },
  });
  
  return { emailLog, accessCode };
}
