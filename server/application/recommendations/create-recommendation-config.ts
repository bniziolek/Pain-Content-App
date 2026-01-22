import type { RecommendationConfig, InsertRecommendationConfig, User } from "@shared/schema";
import type { AppContext } from "../context";

export interface CreateRecommendationConfigInput {
  clinician: User;
  data: InsertRecommendationConfig;
}

export async function createRecommendationConfig(
  _ctx: AppContext,
  _input: CreateRecommendationConfigInput
): Promise<RecommendationConfig> {
  // TODO: create recommendation config and audit settings change.
  throw new Error("createRecommendationConfig not implemented");
}
