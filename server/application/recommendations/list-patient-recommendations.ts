import type { PatientRecommendation, User } from "@shared/schema";
import type { AppContext } from "../context";

export interface ListPatientRecommendationsInput {
  clinician: User;
  patientEmail?: string;
  status?: string;
}

export async function listPatientRecommendations(
  _ctx: AppContext,
  _input: ListPatientRecommendationsInput
): Promise<PatientRecommendation[]> {
  // TODO: list patient recommendations with filters.
  throw new Error("listPatientRecommendations not implemented");
}
