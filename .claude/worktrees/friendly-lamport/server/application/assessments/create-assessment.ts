/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { Assessment, InsertAssessment, User } from "@shared/schema";
import type { AppContext, AuditRequestContext } from "../context";

export interface CreateAssessmentInput {
  auditContext: AuditRequestContext;
  clinician: User;
  data: InsertAssessment;
}

export async function createAssessment(
  ctx: AppContext,
  input: CreateAssessmentInput
): Promise<Assessment> {
  const assessment = await ctx.storage.createAssessment(input.data);

  await ctx.audit.logClinicianAction(input.auditContext, input.clinician, 'assessment_create', {
    resourceType: 'assessment',
    resourceId: assessment.id,
    details: { name: assessment.name },
  });

  return assessment;
}
