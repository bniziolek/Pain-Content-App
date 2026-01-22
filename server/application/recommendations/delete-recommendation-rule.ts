import type { User } from "@shared/schema";
import type { AppContext } from "../context";

export interface DeleteRecommendationRuleInput {
  clinician: User;
  ruleId: string;
}

export async function deleteRecommendationRule(
  _ctx: AppContext,
  _input: DeleteRecommendationRuleInput
): Promise<void> {
  // TODO: delete rule and audit settings change.
  throw new Error("deleteRecommendationRule not implemented");
}
