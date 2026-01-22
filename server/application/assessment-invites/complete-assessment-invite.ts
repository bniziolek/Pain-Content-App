import type { AppContext } from "../context";
import type { AssessmentInvite, AssessmentResponse } from "@shared/schema";
import { calculateTagScores, type ScoringConfig } from "../../domain/scoring";

export interface CompleteAssessmentInviteInput {
  inviteId: string;
  answers: Record<string, unknown>;
}

export interface CompleteAssessmentInviteResult {
  invite: AssessmentInvite;
  response: AssessmentResponse;
  scores: Record<string, number>;
}

export async function completeAssessmentInvite(
  ctx: AppContext,
  input: CompleteAssessmentInviteInput
): Promise<CompleteAssessmentInviteResult> {
  const invite = await ctx.storage.getAssessmentInviteById(input.inviteId);
  if (!invite) {
    throw new Error("Invite not found");
  }
  
  const assessment = await ctx.storage.getAssessmentById(invite.assessmentId);
  if (!assessment) {
    throw new Error("Assessment not found");
  }
  
  const scoringConfig = assessment.scoringConfig as ScoringConfig | null;
  const tagScores = scoringConfig 
    ? calculateTagScores(input.answers, scoringConfig)
    : [];
  
  const tagScoresRecord = tagScores.reduce((acc, ts) => {
    acc[ts.tag] = ts.score;
    return acc;
  }, {} as Record<string, number>);
  
  const response = await ctx.storage.createAssessmentResponse({
    inviteId: invite.id,
    answers: input.answers,
    tagScores: tagScores,
  });
  
  await ctx.storage.updateAssessmentInviteStatus(invite.id, 'completed');
  
  const updatedInvite = await ctx.storage.getAssessmentInviteById(input.inviteId);
  
  return {
    invite: updatedInvite!,
    response,
    scores: tagScoresRecord,
  };
}
