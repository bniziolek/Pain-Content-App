/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { Assessment, InsertAssessment, User } from "@shared/schema";
import type { AppContext, AuditRequestContext } from "../context";

export interface UpdateAssessmentInput {
  auditContext: AuditRequestContext;
  clinician: User;
  assessmentId: string;
  updates: Partial<InsertAssessment> & { isPublished?: boolean };
}

export async function updateAssessment(
  ctx: AppContext,
  input: UpdateAssessmentInput
): Promise<Assessment | null> {
  const assessment = await ctx.storage.updateAssessment(input.assessmentId, input.updates);
  if (!assessment) {
    return null;
  }

  await ctx.audit.logClinicianAction(input.auditContext, input.clinician, 'assessment_update', {
    resourceType: 'assessment',
    resourceId: input.assessmentId,
    details: { name: assessment?.name },
  });

  return assessment;
}
