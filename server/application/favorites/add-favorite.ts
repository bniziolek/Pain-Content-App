import type { AppContext } from "../context";
import type { User } from "@shared/schema";

export interface AddFavoriteInput {
  clinician: User;
  contentId: string;
}

export async function addFavorite(
  ctx: AppContext,
  input: AddFavoriteInput
): Promise<void> {
  await ctx.storage.addFavorite(input.clinician.id, input.contentId);
}
