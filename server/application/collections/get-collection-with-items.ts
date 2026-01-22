/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import type { User } from "@shared/schema";

export interface GetCollectionWithItemsInput {
  clinician: User;
  collectionId: string;
}

export async function getCollectionWithItems(
  ctx: AppContext,
  input: GetCollectionWithItemsInput
): Promise<unknown | null> {
  const collection = await ctx.storage.getCollectionById(input.collectionId);
  if (!collection || collection.userId !== input.clinician.id) {
    return null;
  }

  const items = await ctx.storage.getCollectionItems(input.collectionId);
  return { collection, items };
}
