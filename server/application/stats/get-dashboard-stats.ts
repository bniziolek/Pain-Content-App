/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import type { User } from "@shared/schema";

export interface GetDashboardStatsInput {
  clinician: User;
}

export async function getDashboardStats(
  ctx: AppContext,
  input: GetDashboardStatsInput
): Promise<Record<string, unknown>> {
  const userId = input.clinician.id;

  const [emailLogs, assessmentInvites, internalScreenings, patientPathways] = await Promise.all([
    ctx.storage.getEmailLogsByClinicianId(userId),
    ctx.storage.getAssessmentInvitesByClinicianId(userId),
    ctx.storage.getInternalScreeningsByClinicianId(userId),
    ctx.storage.getPatientPathwaysByClinicianId(userId),
  ]);

  const totalPatients = new Set([
    ...emailLogs.map((e) => e.patientEmail),
    ...assessmentInvites.map((a) => a.patientEmail),
  ]).size;

  const totalContentSent = emailLogs.reduce(
    (sum, log) => sum + (log.contentIds?.length || 0),
    0
  );

  const completedAssessments = assessmentInvites.filter((a) => a.status === "completed").length;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const recentEmails = emailLogs.filter((e) => new Date(e.sentAt) > weekAgo);
  const recentAssessments = assessmentInvites.filter((a) => new Date(a.createdAt) > weekAgo);

  return {
    totalPatients,
    totalContentSent,
    totalEmailsSent: emailLogs.length,
    totalAssessmentsSent: assessmentInvites.length,
    completedAssessments,
    activePathways: patientPathways.filter((p) => p.status === "active").length,
    internalScreenings: internalScreenings.length,
    weeklyActivity: {
      emailsSent: recentEmails.length,
      assessmentsSent: recentAssessments.length,
      assessmentsCompleted: recentAssessments.filter((a) => a.status === "completed").length,
    },
    recentActivity: {
      lastEmail: emailLogs[0]?.sentAt || null,
      lastAssessment: assessmentInvites[0]?.createdAt || null,
    },
  };
}
