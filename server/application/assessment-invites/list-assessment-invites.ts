/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AssessmentInvite, User } from "@shared/schema";
import type { AppContext, AuditRequestContext } from "../context";

export interface ListAssessmentInvitesInput {
  clinician: User;
}

export async function listAssessmentInvites(
  ctx: AppContext,
  auditContext: AuditRequestContext,
  input: ListAssessmentInvitesInput
): Promise<AssessmentInvite[]> {
  const invites = await ctx.storage.getAssessmentInvitesByClinicianId(input.clinician.id);
  
  await ctx.audit.logClinicianAction(auditContext, input.clinician, 'assessment_access', {
    resourceType: 'assessment',
    phiAccessed: true,
    phiScope: 'patient emails in assessment list',
    details: { count: invites.length },
  });
  
  return invites;
}
