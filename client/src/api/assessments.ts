import { fetchAPI, jsonHeaders } from "./base";
import type { AssessmentInvite, InternalScreening } from "@shared/api-types";

export interface Assessment {
  id: string;
  name: string;
  description: string | null;
  surveyJson: any;
  scoringConfig: any;
  clinicianUserId: string;
  isTemplate: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentQuestion {
  id: string;
  type: string;
  title: string;
  description?: string;
  required: boolean;
  choices?: any[];
  tags?: string[];
}

// Assessment CRUD
export async function getAssessments(): Promise<Assessment[]> {
  return fetchAPI("/assessments");
}

export async function getAssessmentById(id: string): Promise<Assessment> {
  return fetchAPI(`/assessments/${id}`);
}

export async function getAssessmentQuestions(id: string): Promise<{
  assessmentId: string;
  assessmentName: string;
  questions: AssessmentQuestion[];
  totalQuestions: number;
}> {
  return fetchAPI(`/assessments/${id}/questions`);
}

export async function createAssessment(assessment: {
  name: string;
  description?: string;
  surveyJson?: any;
  scoringConfig?: any;
  isTemplate?: boolean;
}): Promise<Assessment> {
  return fetchAPI("/assessments", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(assessment),
  });
}

export async function updateAssessment(id: string, updates: Partial<Assessment>): Promise<Assessment> {
  return fetchAPI(`/assessments/${id}`, {
    method: "PATCH",
    headers: jsonHeaders(),
    body: JSON.stringify(updates),
  });
}

export async function deleteAssessment(id: string): Promise<void> {
  await fetchAPI(`/assessments/${id}`, { method: "DELETE" });
}

export async function scoreAssessment(assessmentId: string, answers: any): Promise<{
  tagScores: { tag: string; score: number }[];
  primaryOutcome: string | null;
}> {
  return fetchAPI("/assessments/score", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ assessmentId, answers }),
  });
}

// Assessment Invites
export async function getAssessmentInvites(): Promise<AssessmentInvite[]> {
  return fetchAPI("/assessment-invites");
}

export async function createAssessmentInvite(patientEmail: string, assessmentId?: string): Promise<AssessmentInvite> {
  return fetchAPI("/assessment-invites", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ patientEmail, assessmentId }),
  });
}

export async function getAssessmentResults(inviteId: string): Promise<{
  invite: AssessmentInvite;
  assessment: Assessment;
  recommendations: any[];
}> {
  return fetchAPI(`/assessment-invites/${inviteId}/results`);
}

// Internal Screenings
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
    headers: jsonHeaders(),
    body: JSON.stringify(screening),
  });
}
