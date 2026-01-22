import type { AppContext } from "../context";
import type { User } from "@shared/schema";

export interface PatientSummary {
  patientEmail: string;
  emailLogs: unknown[];
  contentViews: unknown[];
  assessmentResults: unknown[];
  summary: {
    totalEmails: number;
    totalViews: number;
    lastContact: Date | null;
  };
}

export interface GetPatientSummaryInput {
  clinician: User;
  patientEmail: string;
}

export async function getPatientSummary(
  _ctx: AppContext,
  _input: GetPatientSummaryInput
): Promise<PatientSummary> {
  // TODO: gather email logs, content views, assessments, and audit.
  throw new Error("getPatientSummary not implemented");
}
