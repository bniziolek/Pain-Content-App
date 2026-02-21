/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import type { User } from "@shared/schema";

export interface AddToCollectionInput {
  clinician: User;
  collectionId: string;
  contentId: string;
}

export async function addToCollection(
  ctx: AppContext,
  input: AddToCollectionInput
): Promise<unknown | null> {
  const collection = await ctx.storage.getCollectionById(input.collectionId);
  if (!collection || collection.userId !== input.clinician.id) {
    return null;
  }

  await ctx.storage.addItemToCollection(input.collectionId, input.contentId);
  return { collectionId: input.collectionId, contentId: input.contentId };
}
