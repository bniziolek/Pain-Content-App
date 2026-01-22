import type { User } from "@shared/schema";
import type { AppContext } from "../context";

export interface DeleteAssessmentInput {
  clinician: User;
  assessmentId: string;
}

export async function deleteAssessment(
  _ctx: AppContext,
  _input: DeleteAssessmentInput
): Promise<void> {
  // TODO: delete assessment and audit.
  throw new Error("deleteAssessment not implemented");
}
