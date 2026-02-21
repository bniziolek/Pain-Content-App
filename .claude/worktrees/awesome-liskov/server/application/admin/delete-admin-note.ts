/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";

export interface DeleteAdminNoteInput {
  noteId: string;
}

export async function deleteAdminNote(
  ctx: AppContext,
  input: DeleteAdminNoteInput
): Promise<void> {
  await ctx.storage.deleteAdminNote(input.noteId);
}
