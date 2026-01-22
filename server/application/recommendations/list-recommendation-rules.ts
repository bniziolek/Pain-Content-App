import type { ContentRecommendation, User } from "@shared/schema";
import type { AppContext } from "../context";

export interface ListRecommendationRulesInput {
  clinician: User;
}

export async function listRecommendationRules(
  _ctx: AppContext,
  _input: ListRecommendationRulesInput
): Promise<ContentRecommendation[]> {
  // TODO: list recommendation rules.
  throw new Error("listRecommendationRules not implemented");
}
