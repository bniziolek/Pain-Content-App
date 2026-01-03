import type { 
  ContentItem, 
  EmailLog, 
  AssessmentInvite, 
  InternalScreening, 
  ContentView,
  FollowUpRule,
  CarePathway,
  PathwayMilestone,
  PatientPathway,
  ContentRecommendation,
  AuditLog
} from "@shared/schema";

const API_BASE = "/api";

async function fetchAPI(url: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${url}`, {
    credentials: "include",
    ...options,
  });
  
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || `API Error: ${res.status}`);
  }
  
  return res.json();
}

// Content API
export async function getContent(): Promise<ContentItem[]> {
  return fetchAPI("/content");
}

export async function getContentById(id: string): Promise<ContentItem> {
  return fetchAPI(`/content/${id}`);
}

export async function createContent(content: Omit<ContentItem, "id" | "createdAt" | "updatedAt">): Promise<ContentItem> {
  return fetchAPI("/content", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(content),
  });
}

export async function updateContent(id: string, content: Partial<ContentItem>): Promise<ContentItem> {
  return fetchAPI(`/content/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(content),
  });
}

export async function deleteContent(id: string): Promise<void> {
  await fetchAPI(`/content/${id}`, {
    method: "DELETE",
  });
}

// Assessment Invites API
export async function getAssessmentInvites(): Promise<AssessmentInvite[]> {
  return fetchAPI("/assessment-invites");
}

export async function createAssessmentInvite(patientEmail: string, assessmentId?: string): Promise<AssessmentInvite> {
  return fetchAPI("/assessment-invites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ patientEmail, assessmentId }),
  });
}

// Internal Screenings API
export async function getInternalScreenings(): Promise<InternalScreening[]> {
  return fetchAPI("/internal-screenings");
}

export async function createInternalScreening(screening: {
  patientName: string;
  assessmentId?: string;
  answers: any;
  tagScores?: any;
  primaryOutcome?: string;
  recommendedContentIds?: string[];
  notes?: string;
}): Promise<InternalScreening> {
  return fetchAPI("/internal-screenings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(screening),
  });
}

// Email Logs API
export async function getEmailLogs(): Promise<EmailLog[]> {
  return fetchAPI("/email-logs");
}

export async function createEmailLog(log: {
  patientEmail: string;
  subject: string;
  type: string;
  contentIds?: string[];
  providerNote?: string;
}): Promise<EmailLog> {
  return fetchAPI("/email-logs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(log),
  });
}

export async function getContentViewsByEmailLog(emailLogId: string): Promise<ContentView[]> {
  return fetchAPI(`/email-logs/${emailLogId}/content-views`);
}

export async function resendEmailContent(emailLogId: string): Promise<EmailLog> {
  return fetchAPI(`/email-logs/${emailLogId}/resend`, {
    method: "POST",
  });
}

// Stats API
export async function getStats(): Promise<{
  sendsThisWeek: number;
  sendsGrowth: string;
  contentReadRate: string;
  completionRate: string;
  topTags: string[];
  chartData: { name: string; sends: number }[];
  recentActivity: { email: string; action: string; status: string; timeAgo: string }[];
  actionNeeded: { email: string; subject: string; daysSinceSent: number; id: string }[];
}> {
  return fetchAPI("/stats");
}

// Follow-up Rules API
export async function getFollowUpRules(): Promise<FollowUpRule[]> {
  return fetchAPI("/follow-up-rules");
}

export async function createFollowUpRule(rule: {
  name: string;
  triggerType: string;
  triggerDays: number;
  action: string;
  contentIds?: string[];
  message?: string;
}): Promise<FollowUpRule> {
  return fetchAPI("/follow-up-rules", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(rule),
  });
}

export async function updateFollowUpRule(id: string, updates: Partial<FollowUpRule>): Promise<void> {
  await fetchAPI(`/follow-up-rules/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
}

export async function deleteFollowUpRule(id: string): Promise<void> {
  await fetchAPI(`/follow-up-rules/${id}`, { method: "DELETE" });
}

export async function getScheduledFollowUps(): Promise<any[]> {
  return fetchAPI("/scheduled-follow-ups");
}

// Care Pathways API
export async function getPathways(): Promise<{ custom: CarePathway[]; templates: CarePathway[] }> {
  return fetchAPI("/pathways");
}

export async function getPathwayById(id: string): Promise<CarePathway & { milestones: PathwayMilestone[] }> {
  return fetchAPI(`/pathways/${id}`);
}

export async function createPathway(pathway: {
  name: string;
  description?: string;
  condition?: string;
  durationWeeks?: number;
}): Promise<CarePathway> {
  return fetchAPI("/pathways", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pathway),
  });
}

export async function updatePathway(id: string, updates: Partial<CarePathway>): Promise<CarePathway> {
  return fetchAPI(`/pathways/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
}

export async function deletePathway(id: string): Promise<void> {
  await fetchAPI(`/pathways/${id}`, { method: "DELETE" });
}

export async function createPathwayMilestone(pathwayId: string, milestone: {
  weekNumber: number;
  title: string;
  description?: string;
  contentIds?: string[];
  assessmentId?: string;
}): Promise<PathwayMilestone> {
  return fetchAPI(`/pathways/${pathwayId}/milestones`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(milestone),
  });
}

export async function updateMilestone(id: string, updates: Partial<PathwayMilestone>): Promise<void> {
  await fetchAPI(`/milestones/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
}

export async function deleteMilestone(id: string): Promise<void> {
  await fetchAPI(`/milestones/${id}`, { method: "DELETE" });
}

// Patient Pathways API
export async function getPatientPathways(): Promise<PatientPathway[]> {
  return fetchAPI("/patient-pathways");
}

export async function createPatientPathway(enrollment: {
  pathwayId: string;
  patientEmail: string;
  patientName?: string;
  startDate: string;
  notes?: string;
}): Promise<PatientPathway> {
  return fetchAPI("/patient-pathways", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(enrollment),
  });
}

export async function updatePatientPathway(id: string, updates: Partial<PatientPathway>): Promise<PatientPathway> {
  return fetchAPI(`/patient-pathways/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
}

// Content Recommendations API
export async function getRecommendations(): Promise<ContentRecommendation[]> {
  return fetchAPI("/recommendations");
}

export async function getRecommendationsForScores(tagScores: Record<string, number>): Promise<(ContentRecommendation & { content: ContentItem })[]> {
  return fetchAPI("/recommendations/for-scores", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tagScores }),
  });
}

// Admin API
export async function getAdminAnalytics(): Promise<{
  subscriptionHealth: {
    totalActive: number;
    mrr: number;
    newThisMonth: number;
    canceledThisMonth: number;
    churnRate: string;
    averageRevenue: number;
  };
  usageMetrics: {
    totalClinicians: number;
    activeLastWeek: number;
    totalContentSent: number;
    totalAssessments: number;
    engagementRate: number;
  };
  growth: {
    signupsLast30Days: number;
    previousPeriod: number;
  };
}> {
  return fetchAPI("/admin/analytics");
}

export async function getAuditLogs(filters?: { userId?: string; action?: string; limit?: number }): Promise<AuditLog[]> {
  const params = new URLSearchParams();
  if (filters?.userId) params.set("userId", filters.userId);
  if (filters?.action) params.set("action", filters.action);
  if (filters?.limit) params.set("limit", String(filters.limit));
  return fetchAPI(`/admin/audit-logs?${params.toString()}`);
}
