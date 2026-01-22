import type { Assessment, InsertAssessment, User } from "@shared/schema";
import type { AppContext } from "../context";

export interface UpdateAssessmentInput {
  clinician: User;
  assessmentId: string;
  updates: Partial<InsertAssessment> & { isPublished?: boolean };
}

export async function updateAssessment(
  _ctx: AppContext,
  _input: UpdateAssessmentInput
): Promise<Assessment | null> {
  // TODO: update assessment and audit change.
  throw new Error("updateAssessment not implemented");
}
