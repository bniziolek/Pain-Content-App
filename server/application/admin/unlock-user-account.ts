/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 * Unlocks a user account by logging an unlock action which resets lockout detection.
 */

import type { AppContext } from "../context";
import type { User } from "@shared/schema";

export interface UnlockUserAccountInput {
  userId: string;
  adminId: string;
}

export interface UnlockUserAccountResult {
  success: boolean;
  user: User;
}

export async function unlockUserAccount(
  ctx: AppContext,
  input: UnlockUserAccountInput
): Promise<UnlockUserAccountResult | null> {
  const user = await ctx.storage.getUser(input.userId);
  if (!user) {
    return null;
  }

  await ctx.storage.createAuditLog({
    userId: input.userId,
    actorType: 'admin',
    action: 'account_unlocked',
    resourceType: 'user',
    resourceId: input.userId,
    phiAccessed: false,
    details: {
      unlockedBy: input.adminId,
      reason: 'Admin unlocked account',
    },
  });

  return {
    success: true,
    user,
  };
}

export async function isUserLocked(
  ctx: AppContext,
  userId: string
): Promise<boolean> {
  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);
  
  const [failedLogins, unlockEvents] = await Promise.all([
    ctx.storage.getAuditLogs({
      userId,
      action: 'login_failed',
      startDate: oneHourAgo,
      limit: 10,
    }),
    ctx.storage.getAuditLogs({
      userId,
      action: 'account_unlocked',
      startDate: oneHourAgo,
      limit: 1,
    }),
  ]);

  if (unlockEvents.length > 0) {
    const lastUnlock = new Date(unlockEvents[0].createdAt);
    const failedAfterUnlock = failedLogins.filter(
      log => new Date(log.createdAt) > lastUnlock
    );
    return failedAfterUnlock.length >= 5;
  }
  
  return failedLogins.length >= 5;
}
