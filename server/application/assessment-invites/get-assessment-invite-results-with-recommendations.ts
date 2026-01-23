/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext, AuditRequestContext } from "../context";
import type { Assessment, AssessmentInvite, User } from "@shared/schema";
import { getRecommendationsWithFallback } from "../recommendations";
import { AppError } from "../errors";

export interface GetAssessmentInviteResultsWithRecommendationsInput {
  auditContext: AuditRequestContext;
  clinician: User;
  inviteId: string;
}

export interface AssessmentInviteResultsWithRecommendations {
  invite: AssessmentInvite;
  assessment: Assessment | null;
  recommendations: unknown[];
}

export async function getAssessmentInviteResultsWithRecommendations(
  ctx: AppContext,
  input: GetAssessmentInviteResultsWithRecommendationsInput
): Promise<AssessmentInviteResultsWithRecommendations> {
  const invite = await ctx.storage.getAssessmentInviteById(input.inviteId);
  if (!invite) {
    throw new AppError(404, "Invite not found");
  }

  if (invite.clinicianUserId !== input.clinician.id) {
    throw new AppError(403, "Unauthorized");
  }

  await ctx.audit.logClinicianAction(input.auditContext, input.clinician, 'assessment_access', {
    resourceType: 'assessment',
    resourceId: invite.id,
    phiAccessed: true,
    phiScope: 'assessment results',
    details: { inviteId: invite.id },
  });

  const assessment = await ctx.storage.getAssessmentById(invite.assessmentId);

  let recommendations: unknown[] = [];
  if (invite.status === "completed") {
    const response = await ctx.storage.getAssessmentResponseByInviteId(invite.id);
    if (response?.tagScores) {
      recommendations = await getRecommendationsWithFallback(
        ctx,
        response.tagScores as any[],
        invite.assessmentId,
        undefined,
        undefined
      );
    }
  }

  return { invite, assessment: assessment ?? null, recommendations };
}
