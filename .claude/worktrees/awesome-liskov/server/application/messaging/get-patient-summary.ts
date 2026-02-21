/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext, AuditRequestContext } from "../context";
import type { User, EmailLog, ContentView, AssessmentInvite } from "@shared/schema";

export interface PatientSummary {
  patientEmail: string;
  emailLogs: EmailLog[];
  contentViews: ContentView[];
  assessmentResults: AssessmentInvite[];
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
  auditContext: AuditRequestContext,
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
  
  const assessmentResults = await ctx.storage.getAssessmentInvitesByPatientEmail(
    input.clinician.id,
    input.patientEmail
  );
  
  const lastContact = emailLogs.length > 0 
    ? new Date(Math.max(...emailLogs.map(log => new Date(log.sentAt).getTime())))
    : null;
  
  await ctx.audit.logClinicianAction(auditContext, input.clinician, 'patient_summary_view', {
    resourceType: 'patient',
    phiAccessed: true,
    phiScope: 'patient email, content views, assessments',
    details: { patientEmail: input.patientEmail },
  });
  
  return {
    patientEmail: input.patientEmail,
    emailLogs,
    contentViews,
    assessmentResults,
    summary: {
      totalEmails: emailLogs.length,
      totalViews: contentViews.length,
      lastContact,
    },
  };
}
