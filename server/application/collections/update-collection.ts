import type { AppContext } from "../context";
import type { User, ContentCollection } from "@shared/schema";

export interface UpdateCollectionInput {
  clinician: User;
  collectionId: string;
  name?: string;
  description?: string;
  sortOrder?: number;
}

export async function updateCollection(
  ctx: AppContext,
  input: UpdateCollectionInput
): Promise<ContentCollection | null> {
  const collection = await ctx.storage.getCollectionById(input.collectionId);
  if (!collection || collection.userId !== input.clinician.id) {
    return null;
  }
  
  const result = await ctx.storage.updateCollection(input.collectionId, {
    name: input.name,
    description: input.description,
    sortOrder: input.sortOrder,
  });
  
  return result ?? null;
}
