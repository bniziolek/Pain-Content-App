import type { AppContext } from "../context";
import type { User, ContentCollection, InsertContentCollection } from "@shared/schema";

export interface CreateCollectionInput {
  clinician: User;
  name: string;
  description?: string;
}

export async function createCollection(
  ctx: AppContext,
  input: CreateCollectionInput
): Promise<ContentCollection> {
  const collection: InsertContentCollection = {
    userId: input.clinician.id,
    name: input.name,
    description: input.description ?? null,
  };
  
  return ctx.storage.createCollection(collection);
}
