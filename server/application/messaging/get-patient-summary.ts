import type { Request } from "express";
import type { AppContext } from "../context";
import type { User, EmailLog, ContentView } from "@shared/schema";

export interface PatientSummary {
  patientEmail: string;
  emailLogs: EmailLog[];
  contentViews: ContentView[];
  summary: {
    totalEmails: number;
    totalViews: number;
    lastContact: Date | null;
  };
}

export interface GetPatientSummaryInput {
  clinician: User;
  patientEmail: string;
}

export async function getPatientSummary(
  ctx: AppContext,
  req: Request,
  input: GetPatientSummaryInput
): Promise<PatientSummary> {
  const emailLogs = await ctx.storage.getEmailLogsByPatientEmail(
    input.clinician.id,
    input.patientEmail
  );
  
  const contentViewPromises = emailLogs.map(log => 
    ctx.storage.getContentViewsByEmailLogId(log.id)
  );
  const contentViewsArrays = await Promise.all(contentViewPromises);
  const contentViews = contentViewsArrays.flat();
  
  const lastContact = emailLogs.length > 0 
    ? new Date(Math.max(...emailLogs.map(log => new Date(log.sentAt).getTime())))
    : null;
  
  await ctx.audit.logClinicianAction(req, input.clinician, 'patient_summary_view', {
    resourceType: 'patient',
    phiAccessed: true,
    phiScope: 'patient email, content views',
    details: { patientEmail: input.patientEmail },
  });
  
  return {
    patientEmail: input.patientEmail,
    emailLogs,
    contentViews,
    summary: {
      totalEmails: emailLogs.length,
      totalViews: contentViews.length,
      lastContact,
    },
  };
}
