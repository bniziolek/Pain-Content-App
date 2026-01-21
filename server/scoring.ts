import { storage } from "./storage";
import { generateRecommendations as getRecommendationsFromEngine } from "./recommendation";
import {
  TagScore,
  ScoringResult,
  ScoringConfig,
  OutcomeRules,
  calculateTagScores,
  determinePrimaryOutcome,
  extractQuestionMetadata,
} from "./domain/scoring";

export type { TagScore, ScoringResult, ScoringConfig, OutcomeRule, OutcomeRules } from "./domain/scoring";

export async function scoreAssessmentResponse(
  assessmentId: string,
  answers: Record<string, unknown>
): Promise<ScoringResult> {
  const assessment = await storage.getAssessmentById(assessmentId);
  if (!assessment) {
    throw new Error("Assessment not found");
  }

  const scoringConfig = assessment.scoringConfig as ScoringConfig | null;
  const outcomeRules = assessment.outcomeRules as OutcomeRules | null;
  const surveyJson = assessment.surveyJson as { pages?: Array<{ elements?: any[] }> } | null;

  const questionMetadata = extractQuestionMetadata(surveyJson);
  const tagScores = calculateTagScores(answers, scoringConfig, questionMetadata);
  const primaryOutcome = determinePrimaryOutcome(tagScores, outcomeRules);
  
  const recommendationResult = await getRecommendationsFromEngine({
    tagScores,
    rawAnswers: answers,
    assessmentId,
    clinicianUserId: assessment.clinicianUserId || undefined,
  });

  return {
    tagScores,
    primaryOutcome,
    recommendations: recommendationResult.recommendations.map(r => r.contentId),
  };
}

export async function processAndStoreScores(
  responseId: string,
  assessmentId: string,
  answers: Record<string, unknown>
): Promise<ScoringResult> {
  const result = await scoreAssessmentResponse(assessmentId, answers);
  return result;
}
