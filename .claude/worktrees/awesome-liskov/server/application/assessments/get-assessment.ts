/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { Assessment, User } from "@shared/schema";
import type { AppContext, AuditRequestContext } from "../context";

export interface GetAssessmentInput {
  auditContext: AuditRequestContext;
  clinician: User;
  assessmentId: string;
}

export async function getAssessment(
  ctx: AppContext,
  input: GetAssessmentInput
): Promise<Assessment | null> {
  const assessment = await ctx.storage.getAssessmentById(input.assessmentId);
  if (!assessment) {
    return null;
  }

  await ctx.audit.logClinicianAction(input.auditContext, input.clinician, 'assessment_access', {
    resourceType: 'assessment',
    resourceId: input.assessmentId,
    details: { name: assessment.name },
  });

  return assessment;
}
