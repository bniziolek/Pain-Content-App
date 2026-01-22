import type { Request } from "express";
import type { EmailLog, User } from "@shared/schema";
import type { AppContext } from "../context";
import { createSecureAccessCode } from "../../domain/messaging";

export interface ResendContentEmailInput {
  clinician: User;
  emailLogId: string;
  providerNote?: string;
}

export interface ResendContentEmailResult {
  emailLog: EmailLog;
  accessCode: string;
}

export async function resendContentEmailFlow(
  ctx: AppContext,
  req: Request,
  input: ResendContentEmailInput
): Promise<ResendContentEmailResult> {
  const originalLog = await ctx.storage.getEmailLogById(input.emailLogId);
  if (!originalLog) {
    throw new Error("Email log not found");
  }
  
  const { accessCode, accessCodeHash, accessCodeSalt } = createSecureAccessCode();
  
  const newLog = await ctx.storage.createEmailLog({
    clinicianUserId: input.clinician.id,
    patientEmail: originalLog.patientEmail,
    subject: originalLog.subject,
    contentIds: originalLog.contentIds,
    providerNote: input.providerNote || originalLog.providerNote,
    type: originalLog.type,
    accessCodeHash,
    accessCodeSalt,
    accessCodeGeneratedAt: ctx.now(),
    parentEmailLogId: originalLog.id,
  });
  
  const contentItems = (await Promise.all(
    (originalLog.contentIds as string[]).map((id: string) => ctx.storage.getContentById(id))
  )).filter(Boolean);
  
  const baseUrl = process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000';
  const contentItemsWithUrls = contentItems.map((item: any) => ({
    title: item.title,
    summary: item.summary || '',
    readTime: item.readTime,
    imageUrl: item.imageUrl,
    viewUrl: `${baseUrl}/view/${newLog.id}?content=${item.id}`,
  }));
  
  await ctx.email.sendContentEmail({
    toEmail: originalLog.patientEmail,
    subject: originalLog.subject,
    contentItems: contentItemsWithUrls,
    providerNote: input.providerNote || originalLog.providerNote || undefined,
  });
  
  await ctx.audit.logClinicianAction(req, input.clinician, 'email_sent', {
    resourceType: 'email_log',
    resourceId: newLog.id,
    phiAccessed: true,
    phiScope: 'patient email, content resend',
    details: { 
      patientEmail: originalLog.patientEmail, 
      contentCount: (originalLog.contentIds as string[]).length,
      originalEmailLogId: originalLog.id,
    },
  });
  
  return { emailLog: newLog, accessCode };
}
