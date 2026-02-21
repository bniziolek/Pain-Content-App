/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import type { User } from "@shared/schema";

export interface DeleteCollectionInput {
  clinician: User;
  collectionId: string;
}

export async function deleteCollection(
  ctx: AppContext,
  input: DeleteCollectionInput
): Promise<boolean> {
  const collection = await ctx.storage.getCollectionById(input.collectionId);
  if (!collection || collection.userId !== input.clinician.id) {
    return false;
  }
  
  await ctx.storage.deleteCollection(input.collectionId);
  return true;
}
