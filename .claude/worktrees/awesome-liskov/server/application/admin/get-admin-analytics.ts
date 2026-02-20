/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import type { User } from "@shared/schema";

export interface AdminAnalytics {
  totalUsers: number;
  activeSubscriptions: number;
  totalContentSent: number;
  totalAssessmentsSent: number;
}

export async function getAdminAnalytics(ctx: AppContext): Promise<AdminAnalytics> {
  const users = await ctx.storage.getAllUsers();
  const activeSubscriptions = users.filter((u: User) => 
    u.subscriptionStatus === 'active' || u.subscriptionStatus === 'trialing'
  ).length;
  
  // Batch queries to avoid N+1 pattern
  const emailLogsPromises = users.map((user: User) =>
    ctx.storage.getEmailLogsByClinicianId(user.id)
  );
  const invitePromises = users.map((user: User) =>
    ctx.storage.getAssessmentInvitesByClinicianId(user.id)
  );

  const [emailLogsResults, invitesResults] = await Promise.all([
    Promise.all(emailLogsPromises),
    Promise.all(invitePromises),
  ]);

  let totalContentSent = 0;
  let totalAssessmentsSent = 0;

  for (const emailLogs of emailLogsResults) {
    totalContentSent += emailLogs.length;
  }

  for (const invites of invitesResults) {
    totalAssessmentsSent += invites.length;
  }
  
  return {
    totalUsers: users.length,
    activeSubscriptions,
    totalContentSent,
    totalAssessmentsSent,
  };
}
