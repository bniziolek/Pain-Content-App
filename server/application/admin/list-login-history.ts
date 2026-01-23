/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";

export interface ListLoginHistoryInput {
  userId: string;
}

export async function listLoginHistory(
  ctx: AppContext,
  input: ListLoginHistoryInput
): Promise<unknown[]> {
  return ctx.storage.getLoginHistory(input.userId);
}
