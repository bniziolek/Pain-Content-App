/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import type { User } from "@shared/schema";

export interface ListPersonaHistoryInput {
  admin: User;
}

export async function listPersonaHistory(
  ctx: AppContext,
  input: ListPersonaHistoryInput
): Promise<unknown[]> {
  return ctx.storage.getPersonaSwitchHistory(input.admin.id);
}
