import type { Assessment, InsertAssessment, User } from "@shared/schema";
import type { AppContext } from "../context";

export interface CreateAssessmentInput {
  clinician: User;
  data: InsertAssessment;
}

export async function createAssessment(
  _ctx: AppContext,
  _input: CreateAssessmentInput
): Promise<Assessment> {
  // TODO: validate and create assessment, audit creation.
  throw new Error("createAssessment not implemented");
}
