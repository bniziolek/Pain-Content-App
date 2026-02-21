/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 * Provides aggregated support dashboard data for a single user.
 */

import type { AppContext } from "../context";
import type { User } from "@shared/schema";
import { isUserLocked } from "./unlock-user-account";

export interface GetUserSupportOverviewInput {
  userId: string;
}

export interface UserSupportOverview {
  user: User;
  stats: {
    contentSentCount: number;
    assessmentsCreatedCount: number;
    internalScreeningsCount: number;
    lastLoginAt: string | null;
    accountCreatedAt: string;
  };
  status: {
    isActive: boolean;
    isTrial: boolean;
    isExpired: boolean;
    isLocked: boolean;
    daysUntilExpiration: number | null;
  };
  recentNoteCount: number;
}

export async function getUserSupportOverview(
  ctx: AppContext,
  input: GetUserSupportOverviewInput
): Promise<UserSupportOverview | null> {
  const user = await ctx.storage.getUser(input.userId);
  if (!user) {
    return null;
  }

  const [contentActivity, loginHistory, adminNotes] = await Promise.all([
    ctx.storage.getUserContentActivity(input.userId),
    ctx.storage.getLoginHistory(input.userId, 1),
    ctx.storage.getAdminNotes(input.userId),
  ]);

  const assessments = await ctx.storage.getAssessmentsByClinicianId(input.userId);
  const internalScreenings = await ctx.storage.getInternalScreeningsByClinicianId(input.userId);

  const lastLogin = loginHistory.length > 0 ? loginHistory[0] : null;

  const subscriptionStatus = user.subscriptionStatus || 'inactive';
  const subscriptionPeriodEnd = user.subscriptionPeriodEnd;
  
  const now = new Date();
  let daysUntilExpiration: number | null = null;
  let isExpired = false;
  let isTrial = false;
  
  if (subscriptionPeriodEnd) {
    const endDate = new Date(subscriptionPeriodEnd);
    const diffTime = endDate.getTime() - now.getTime();
    daysUntilExpiration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    isExpired = daysUntilExpiration < 0;
  }
  
  if (subscriptionStatus === 'trialing') {
    isTrial = true;
  }
  
  const isActive = subscriptionStatus === 'active' && !isExpired;

  const isLocked = await isUserLocked(ctx, input.userId);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentNotes = adminNotes.filter(note => {
    const noteDate = new Date(note.createdAt);
    return noteDate >= thirtyDaysAgo;
  });

  return {
    user,
    stats: {
      contentSentCount: contentActivity.length,
      assessmentsCreatedCount: assessments?.length || 0,
      internalScreeningsCount: internalScreenings?.length || 0,
      lastLoginAt: lastLogin?.createdAt ? new Date(lastLogin.createdAt).toISOString() : null,
      accountCreatedAt: user.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString(),
    },
    status: {
      isActive,
      isTrial,
      isExpired,
      isLocked,
      daysUntilExpiration,
    },
    recentNoteCount: recentNotes.length,
  };
}
