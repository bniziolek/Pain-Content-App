/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext, AuditRequestContext } from "../context";
import type { ScoringResult } from "../../domain/scoring";
import { AppError } from "../errors";
import { scoreAssessment } from "../assessments";

export interface CompleteAssessmentInviteInput {
  auditContext: AuditRequestContext;
  inviteId: string;
  answers: Record<string, unknown>;
}

export interface CompleteAssessmentInviteResult {
  result: ScoringResult;
}

export async function completeAssessmentInvite(
  ctx: AppContext,
  input: CompleteAssessmentInviteInput
): Promise<CompleteAssessmentInviteResult> {
  const invite = await ctx.storage.getAssessmentInviteById(input.inviteId);
  if (!invite) {
    throw new AppError(404, "Invite not found");
  }
  
  const assessment = await ctx.storage.getAssessmentById(invite.assessmentId);
  if (!assessment) {
    throw new AppError(404, "Assessment not found");
  }
  
  const clinician = await ctx.storage.getUser(invite.clinicianUserId);
  if (!clinician) {
    throw new AppError(404, "Clinician not found");
  }

  const result = await scoreAssessment(ctx, {
    auditContext: input.auditContext,
    clinician,
    assessmentId: invite.assessmentId,
    answers: input.answers,
  });

  await ctx.storage.createAssessmentResponse({
    inviteId: invite.id,
    answers: input.answers,
    tagScores: result.tagScores,
    recommendedContentIds: result.recommendations,
  });
  await ctx.storage.updateAssessmentInviteStatus(invite.id, "completed", new Date());

  return { result };
}
