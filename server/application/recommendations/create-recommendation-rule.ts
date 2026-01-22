import type { ContentRecommendation, InsertContentRecommendation, User } from "@shared/schema";
import type { AppContext } from "../context";

export interface CreateRecommendationRuleInput {
  clinician: User;
  data: InsertContentRecommendation;
}

export async function createRecommendationRule(
  _ctx: AppContext,
  _input: CreateRecommendationRuleInput
): Promise<ContentRecommendation> {
  // TODO: create recommendation rule and audit settings change.
  throw new Error("createRecommendationRule not implemented");
}
