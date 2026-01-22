import type { User } from "@shared/schema";
import type { AppContext } from "../context";
import type { FullRecommendationResult } from "../../domain/recommendations";

export interface PreviewRecommendationsInput {
  clinician: User;
  tagScores: Array<{ tag: string; percentage: number }>;
  assessmentId?: string;
  pathwayId?: string;
  pathwayWeek?: number;
}

export async function previewRecommendations(
  _ctx: AppContext,
  _input: PreviewRecommendationsInput
): Promise<FullRecommendationResult> {
  // TODO: produce full recommendation result for preview.
  throw new Error("previewRecommendations not implemented");
}
