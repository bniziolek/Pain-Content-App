/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";

export interface DeleteContentRecommendationInput {
  recommendationId: string;
}

export async function deleteContentRecommendation(
  ctx: AppContext,
  input: DeleteContentRecommendationInput
): Promise<void> {
  await ctx.storage.deleteContentRecommendation(input.recommendationId);
}
