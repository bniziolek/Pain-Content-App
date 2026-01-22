import type { Assessment, User } from "@shared/schema";
import type { AppContext } from "../context";

export interface GetAssessmentInput {
  clinician: User;
  assessmentId: string;
}

export async function getAssessment(
  _ctx: AppContext,
  _input: GetAssessmentInput
): Promise<Assessment | null> {
  // TODO: fetch single assessment and audit access.
  throw new Error("getAssessment not implemented");
}
