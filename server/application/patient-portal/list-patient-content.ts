import type { AppContext } from "../context";

export interface ListPatientContentInput {
  sessionToken: string;
}

export interface PatientContentSummary {
  content: unknown[];
  assessments: Array<{ id: string; token: string; status: string; createdAt: Date }>;
}

export async function listPatientContent(
  _ctx: AppContext,
  _input: ListPatientContentInput
): Promise<PatientContentSummary> {
  // TODO: validate session, update activity, load content and assessments, audit.
  throw new Error("listPatientContent not implemented");
}
