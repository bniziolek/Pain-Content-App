/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";

export interface ListUserPermissionsInput {
  userId: string;
}

export async function listUserPermissions(
  ctx: AppContext,
  input: ListUserPermissionsInput
): Promise<unknown[]> {
  return ctx.storage.getUserPermissions(input.userId);
}
