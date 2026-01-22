import type { AppContext } from "../context";
import type { User } from "@shared/schema";

export interface RemoveFavoriteInput {
  clinician: User;
  contentId: string;
}

export async function removeFavorite(
  ctx: AppContext,
  input: RemoveFavoriteInput
): Promise<void> {
  await ctx.storage.removeFavorite(input.clinician.id, input.contentId);
}
