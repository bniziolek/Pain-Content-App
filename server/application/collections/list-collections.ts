import type { AppContext } from "../context";
import type { User, ContentCollection } from "@shared/schema";

export interface ListCollectionsInput {
  clinician: User;
}

export async function listCollections(
  ctx: AppContext,
  input: ListCollectionsInput
): Promise<ContentCollection[]> {
  return ctx.storage.getUserCollections(input.clinician.id);
}
