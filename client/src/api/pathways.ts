import { fetchAPI, jsonHeaders } from "./base";
import type { CarePathway, PathwayMilestone, PatientPathway, FollowUpRule } from "@shared/api-types";

// Care Pathways
export async function getPathways(): Promise<CarePathway[]> {
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
    headers: jsonHeaders(),
    body: JSON.stringify(pathway),
  });
}

export async function updatePathway(id: string, updates: Partial<CarePathway>): Promise<CarePathway> {
  return fetchAPI(`/pathways/${id}`, {
    method: "PATCH",
    headers: jsonHeaders(),
    body: JSON.stringify(updates),
  });
}

export async function deletePathway(id: string): Promise<void> {
  await fetchAPI(`/pathways/${id}`, { method: "DELETE" });
}

// Pathway Milestones
export async function getPathwayMilestones(pathwayId: string): Promise<PathwayMilestone[]> {
  return fetchAPI(`/pathways/${pathwayId}/milestones`);
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
    headers: jsonHeaders(),
    body: JSON.stringify(milestone),
  });
}

export async function updateMilestone(pathwayId: string, id: string, updates: Partial<PathwayMilestone>): Promise<PathwayMilestone> {
  return fetchAPI(`/pathways/${pathwayId}/milestones/${id}`, {
    method: "PATCH",
    headers: jsonHeaders(),
    body: JSON.stringify(updates),
  });
}

export async function deleteMilestone(pathwayId: string, id: string): Promise<void> {
  await fetchAPI(`/pathways/${pathwayId}/milestones/${id}`, { method: "DELETE" });
}

// Patient Pathways
export async function getPatientPathways(): Promise<PatientPathway[]> {
  return fetchAPI("/pathways/patients/active");
}

export async function createPatientPathway(enrollment: {
  pathwayId: string;
  patientEmail: string;
  patientName?: string;
  startDate: string;
  notes?: string;
}): Promise<PatientPathway> {
  return fetchAPI("/pathways/patients", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(enrollment),
  });
}

export async function updatePatientPathway(id: string, updates: Partial<PatientPathway>): Promise<PatientPathway> {
  return fetchAPI(`/pathways/patients/${id}`, {
    method: "PATCH",
    headers: jsonHeaders(),
    body: JSON.stringify(updates),
  });
}

// Follow-up Rules
export type TemplateWithStatus = FollowUpRule & { isEnabled: boolean };

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
    headers: jsonHeaders(),
    body: JSON.stringify(rule),
  });
}

export async function updateFollowUpRule(id: string, updates: Partial<FollowUpRule>): Promise<FollowUpRule> {
  return fetchAPI(`/follow-up-rules/${id}`, {
    method: "PATCH",
    headers: jsonHeaders(),
    body: JSON.stringify(updates),
  });
}

export async function deleteFollowUpRule(id: string): Promise<void> {
  await fetchAPI(`/follow-up-rules/${id}`, { method: "DELETE" });
}
