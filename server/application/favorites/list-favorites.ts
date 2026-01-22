/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import type { User } from "@shared/schema";

export interface ListFavoritesInput {
  clinician: User;
}

export interface FavoriteItem {
  contentId: string;
  title: string;
  createdAt: Date;
}

export async function listFavorites(
  ctx: AppContext,
  input: ListFavoritesInput
): Promise<FavoriteItem[]> {
  return ctx.storage.getUserFavorites(input.clinician.id);
}
