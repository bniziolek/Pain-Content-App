/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { User } from "@shared/schema";
import type { AppContext, AuditRequestContext } from "../context";

export interface DeleteAssessmentInput {
  auditContext: AuditRequestContext;
  clinician: User;
  assessmentId: string;
}

export async function deleteAssessment(
  ctx: AppContext,
  input: DeleteAssessmentInput
): Promise<void> {
  await ctx.audit.logClinicianAction(input.auditContext, input.clinician, 'assessment_delete', {
    resourceType: 'assessment',
    resourceId: input.assessmentId,
  });

  await ctx.storage.deleteAssessment(input.assessmentId);
}
