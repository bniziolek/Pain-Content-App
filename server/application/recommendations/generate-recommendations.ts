/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { User } from "@shared/schema";
import type { AppContext } from "../context";
import type { RecommendationResult } from "../../domain/recommendations";
import { getRecommendationsWithFallback } from "./recommendation-engine";

export interface GenerateRecommendationsInput {
  clinician: User;
  tagScores: Array<{ tag: string; percentage: number }>;
  assessmentId?: string;
  pathwayId?: string;
  pathwayWeek?: number;
}

export async function generateRecommendations(
  ctx: AppContext,
  input: GenerateRecommendationsInput
): Promise<RecommendationResult[]> {
  return getRecommendationsWithFallback(
    ctx,
    input.tagScores as any,
    input.assessmentId,
    input.pathwayId,
    input.pathwayWeek
  );
}
