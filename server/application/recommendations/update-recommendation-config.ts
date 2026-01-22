import type { RecommendationConfig, InsertRecommendationConfig, User } from "@shared/schema";
import type { AppContext } from "../context";

export interface UpdateRecommendationConfigInput {
  clinician: User;
  configId: string;
  updates: Partial<InsertRecommendationConfig> & { isActive?: boolean };
}

export async function updateRecommendationConfig(
  _ctx: AppContext,
  _input: UpdateRecommendationConfigInput
): Promise<RecommendationConfig | null> {
  // TODO: update recommendation config and audit settings change.
  throw new Error("updateRecommendationConfig not implemented");
}
