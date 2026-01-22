import type { Assessment, User } from "@shared/schema";
import type { AppContext } from "../context";

export interface ListAssessmentsInput {
  clinician: User;
}

export async function listAssessments(
  _ctx: AppContext,
  _input: ListAssessmentsInput
): Promise<Assessment[]> {
  // TODO: fetch assessments and audit access.
  throw new Error("listAssessments not implemented");
}
