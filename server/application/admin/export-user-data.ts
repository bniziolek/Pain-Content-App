/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import type { User } from "@shared/schema";

export interface ExportUserDataInput {
  userId: string;
}

export interface ExportUserDataResult {
  user: User;
  notes: unknown[];
  loginHistory: unknown[];
  contentActivity: unknown[];
  exportedAt: string;
}

export async function exportUserData(
  ctx: AppContext,
  input: ExportUserDataInput
): Promise<ExportUserDataResult | null> {
  const user = await ctx.storage.getUser(input.userId);
  if (!user) {
    return null;
  }

  const notes = await ctx.storage.getAdminNotes(input.userId);
  const loginHistory = await ctx.storage.getLoginHistory(input.userId);
  const contentActivity = await ctx.storage.getUserContentActivity(input.userId);

  return {
    user,
    notes,
    loginHistory,
    contentActivity,
    exportedAt: new Date().toISOString(),
  };
}
