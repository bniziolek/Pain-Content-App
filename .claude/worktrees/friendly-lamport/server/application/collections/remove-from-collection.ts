/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import type { User } from "@shared/schema";

export interface RemoveFromCollectionInput {
  clinician: User;
  collectionId: string;
  contentId: string;
}

export async function removeFromCollection(
  ctx: AppContext,
  input: RemoveFromCollectionInput
): Promise<boolean> {
  const collection = await ctx.storage.getCollectionById(input.collectionId);
  if (!collection || collection.userId !== input.clinician.id) {
    return false;
  }

  const items = await ctx.storage.getCollectionItems(input.collectionId);
  const hasItem = items.some((item) => item.contentId === input.contentId);
  if (!hasItem) {
    return false;
  }

  await ctx.storage.removeItemFromCollection(input.collectionId, input.contentId);
  return true;
}
