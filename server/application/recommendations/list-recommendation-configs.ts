import type { RecommendationConfig, User } from "@shared/schema";
import type { AppContext } from "../context";

export interface ListRecommendationConfigsInput {
  clinician: User;
  assessmentId?: string;
  pathwayId?: string;
}

export async function listRecommendationConfigs(
  _ctx: AppContext,
  _input: ListRecommendationConfigsInput
): Promise<RecommendationConfig[]> {
  // TODO: list recommendation configs.
  throw new Error("listRecommendationConfigs not implemented");
}
