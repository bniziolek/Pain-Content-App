/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";

export interface ListContentRecommendationsInput {
  tag?: string;
  minScore?: number;
  maxScore?: number;
}

export async function listContentRecommendations(
  ctx: AppContext,
  input: ListContentRecommendationsInput
): Promise<unknown[]> {
  return ctx.storage.getContentRecommendations({
    tag: input.tag,
    minScore: input.minScore,
    maxScore: input.maxScore,
  });
}
