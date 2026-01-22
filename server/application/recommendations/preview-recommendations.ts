/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { User } from "@shared/schema";
import type { AppContext } from "../context";
import type { FullRecommendationResult } from "../../domain/recommendations";
import { previewRecommendationResults } from "./recommendation-engine";

export interface PreviewRecommendationsInput {
  clinician: User;
  tagScores: Array<{ tag: string; percentage: number }>;
  assessmentId?: string;
  pathwayId?: string;
  pathwayWeek?: number;
}

export async function previewRecommendations(
  ctx: AppContext,
  input: PreviewRecommendationsInput
): Promise<FullRecommendationResult> {
  return previewRecommendationResults(
    ctx,
    input.tagScores as any,
    input.assessmentId,
    input.pathwayId,
    input.pathwayWeek
  );
}
