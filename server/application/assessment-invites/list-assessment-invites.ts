import type { Request } from "express";
import type { AssessmentInvite, User } from "@shared/schema";
import type { AppContext } from "../context";

export interface ListAssessmentInvitesInput {
  clinician: User;
}

export async function listAssessmentInvites(
  ctx: AppContext,
  req: Request,
  input: ListAssessmentInvitesInput
): Promise<AssessmentInvite[]> {
  const invites = await ctx.storage.getAssessmentInvitesByClinicianId(input.clinician.id);
  
  await ctx.audit.logClinicianAction(req, input.clinician, 'assessment_access', {
    resourceType: 'assessment',
    phiAccessed: true,
    phiScope: 'patient emails in assessment list',
    details: { count: invites.length },
  });
  
  return invites;
}
