/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { Assessment, User } from "@shared/schema";
import type { AppContext, AuditRequestContext } from "../context";

export interface ListAssessmentsInput {
  auditContext: AuditRequestContext;
  clinician: User;
  typeFilter?: string;
}

export async function listAssessments(
  ctx: AppContext,
  input: ListAssessmentsInput
): Promise<Assessment[]> {
  const assessments = await ctx.storage.getAssessmentsByClinicianId(input.clinician.id);

  await ctx.audit.logClinicianAction(input.auditContext, input.clinician, 'assessment_access', {
    resourceType: 'assessment',
    details: { count: assessments.length, typeFilter: input.typeFilter },
  });

  return assessments;
}
