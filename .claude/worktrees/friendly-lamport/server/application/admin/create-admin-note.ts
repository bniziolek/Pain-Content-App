/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import type { User } from "@shared/schema";

export interface CreateAdminNoteInput {
  admin: User;
  userId: string;
  note: string;
}

export async function createAdminNote(
  ctx: AppContext,
  input: CreateAdminNoteInput
): Promise<unknown> {
  return ctx.storage.createAdminNote({
    userId: input.userId,
    adminId: input.admin.id,
    note: input.note,
  });
}
