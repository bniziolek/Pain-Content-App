/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { ContentRecommendation, User } from "@shared/schema";
import type { AppContext } from "../context";

export interface ListRecommendationRulesInput {
  clinician: User;
}

export async function listRecommendationRules(
  ctx: AppContext,
  _input: ListRecommendationRulesInput
): Promise<ContentRecommendation[]> {
  return ctx.storage.getContentRecommendations();
}
