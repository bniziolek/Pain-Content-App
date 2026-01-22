/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import { hashPassword } from "../../domain/password";

export interface ResetUserPasswordInput {
  userId: string;
  newPassword?: string;
}

export async function resetUserPassword(
  ctx: AppContext,
  input: ResetUserPasswordInput
): Promise<void> {
  const hashedPassword = await hashPassword(input.newPassword || "changeme123");
  await ctx.storage.updateUserPassword(input.userId, hashedPassword);
}
