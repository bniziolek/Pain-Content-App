/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";

export interface DeleteUserInput {
  userId: string;
}

export async function deleteUser(
  ctx: AppContext,
  input: DeleteUserInput
): Promise<void> {
  await ctx.storage.deleteUser(input.userId);
}
