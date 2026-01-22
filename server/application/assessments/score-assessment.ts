import type { Request } from "express";
import type { User } from "@shared/schema";
import type { AppContext } from "../context";
import { AppError } from "../errors";
import type { ScoringResult } from "../../domain/scoring";
import {
  calculateTagScores,
  determinePrimaryOutcome,
  extractQuestionMetadata,
  type ScoringConfig,
  type OutcomeRules,
} from "../../domain/scoring";
import { generateRecommendations } from "../../recommendation";

export interface ScoreAssessmentInput {
  req: Request;
  clinician: User;
  assessmentId: string;
  answers: Record<string, unknown>;
}

export async function scoreAssessment(
  ctx: AppContext,
  input: ScoreAssessmentInput
): Promise<ScoringResult> {
  const assessment = await ctx.storage.getAssessmentById(input.assessmentId);
  if (!assessment) {
    throw new AppError(404, "Assessment not found");
  }

  const scoringConfig = assessment.scoringConfig as ScoringConfig | null;
  const outcomeRules = assessment.outcomeRules as OutcomeRules | null;
  const surveyJson = assessment.surveyJson as { pages?: Array<{ elements?: any[] }> } | null;

  const questionMetadata = extractQuestionMetadata(surveyJson);
  const tagScores = calculateTagScores(input.answers, scoringConfig, questionMetadata);
  const primaryOutcome = determinePrimaryOutcome(tagScores, outcomeRules);

  const recommendationResult = await generateRecommendations({
    tagScores,
    rawAnswers: input.answers,
    assessmentId: input.assessmentId,
    clinicianUserId: assessment.clinicianUserId || undefined,
  });

  await ctx.audit.logClinicianAction(input.req, input.clinician, "assessment_score", {
    resourceType: "assessment",
    resourceId: input.assessmentId,
    details: { tagCount: tagScores.length },
  });

  return {
    tagScores,
    primaryOutcome,
    recommendations: recommendationResult.recommendations.map((r) => r.contentId),
  };
}
