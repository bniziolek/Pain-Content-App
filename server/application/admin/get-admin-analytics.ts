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
  
  let totalContentSent = 0;
  let totalAssessmentsSent = 0;
  
  for (const user of users) {
    const emailLogs = await ctx.storage.getEmailLogsByClinicianId(user.id);
    totalContentSent += emailLogs.length;
    
    const invites = await ctx.storage.getAssessmentInvitesByClinicianId(user.id);
    totalAssessmentsSent += invites.length;
  }
  
  return {
    totalUsers: users.length,
    activeSubscriptions,
    totalContentSent,
    totalAssessmentsSent,
  };
}
