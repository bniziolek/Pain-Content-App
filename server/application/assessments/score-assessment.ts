import type { User } from "@shared/schema";
import type { AppContext } from "../context";
import type { ScoringResult } from "../../domain/scoring";

export interface ScoreAssessmentInput {
  clinician: User;
  assessmentId: string;
  answers: Record<string, unknown>;
}

export async function scoreAssessment(
  _ctx: AppContext,
  _input: ScoreAssessmentInput
): Promise<ScoringResult> {
  // TODO: load assessment, score with domain services, and audit.
  throw new Error("scoreAssessment not implemented");
}
