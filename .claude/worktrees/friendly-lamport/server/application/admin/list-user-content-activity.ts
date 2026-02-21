/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";

export interface ListUserContentActivityInput {
  userId: string;
}

export async function listUserContentActivity(
  ctx: AppContext,
  input: ListUserContentActivityInput
): Promise<unknown[]> {
  return ctx.storage.getUserContentActivity(input.userId);
}
