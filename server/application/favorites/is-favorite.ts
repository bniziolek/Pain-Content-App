/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import type { User } from "@shared/schema";

export interface IsFavoriteInput {
  clinician: User;
  contentId: string;
}

export interface IsFavoriteResult {
  isFavorite: boolean;
}

export async function isFavorite(
  ctx: AppContext,
  input: IsFavoriteInput
): Promise<IsFavoriteResult> {
  const result = await ctx.storage.isFavorite(input.clinician.id, input.contentId);
  return { isFavorite: result };
}
