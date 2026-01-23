/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext, AuditRequestContext } from "../context";
import type { User } from "@shared/schema";

export interface GetAnalyticsInput {
  clinician: User;
}

export interface ClinicianAnalytics {
  totalEmailsSent: number;
  totalContentViews: number;
  totalAssessmentsSent: number;
  averageContentViewTime: number;
}

export async function getAnalytics(
  ctx: AppContext,
  auditContext: AuditRequestContext,
  input: GetAnalyticsInput
): Promise<ClinicianAnalytics> {
  const emailLogs = await ctx.storage.getEmailLogsByClinicianId(input.clinician.id);
  const invites = await ctx.storage.getAssessmentInvitesByClinicianId(input.clinician.id);
  
  let totalViews = 0;
  let totalTime = 0;
  
  for (const log of emailLogs) {
    const views = await ctx.storage.getContentViewsByEmailLogId(log.id);
    totalViews += views.length;
    totalTime += views.reduce((sum, v) => sum + (v.timeSpentSeconds || 0), 0);
  }
  
  await ctx.audit.logClinicianAction(auditContext, input.clinician, 'phi_view', {
    details: { action: 'viewed_analytics' },
  });
  
  return {
    totalEmailsSent: emailLogs.length,
    totalContentViews: totalViews,
    totalAssessmentsSent: invites.length,
    averageContentViewTime: totalViews > 0 ? Math.round(totalTime / totalViews) : 0,
  };
}
