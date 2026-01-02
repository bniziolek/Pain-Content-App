import type { ContentItem, EmailLog, AssessmentInvite, InternalScreening } from "@shared/schema";

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

// Stats API
export async function getStats(): Promise<{
  sendsThisWeek: number;
  sendsGrowth: string;
  activeAssessments: number;
  completionRate: string;
  topTags: string[];
}> {
  return fetchAPI("/stats");
}
