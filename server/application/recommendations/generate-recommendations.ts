import type { User } from "@shared/schema";
import type { AppContext } from "../context";
import type { RecommendationResult } from "../../domain/recommendations";

export interface GenerateRecommendationsInput {
  clinician: User;
  tagScores: Array<{ tag: string; percentage: number }>;
  assessmentId?: string;
  pathwayId?: string;
  pathwayWeek?: number;
}

export async function generateRecommendations(
  _ctx: AppContext,
  _input: GenerateRecommendationsInput
): Promise<RecommendationResult[]> {
  // TODO: call domain recommendation engine with storage-backed content.
  throw new Error("generateRecommendations not implemented");
}
