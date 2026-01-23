/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";

export interface ListAdminNotesInput {
  userId: string;
}

export async function listAdminNotes(
  ctx: AppContext,
  input: ListAdminNotesInput
): Promise<unknown[]> {
  return ctx.storage.getAdminNotes(input.userId);
}
