/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { PatientRecommendation, User } from "@shared/schema";
import type { AppContext } from "../context";

export interface ListPatientRecommendationsInput {
  clinician: User;
  patientEmail?: string;
  status?: string;
  source?: string;
}

export async function listPatientRecommendations(
  ctx: AppContext,
  input: ListPatientRecommendationsInput
): Promise<PatientRecommendation[]> {
  return ctx.storage.getPatientRecommendations({
    clinicianId: input.clinician.id,
    patientEmail: input.patientEmail,
    status: input.status,
    source: input.source,
  });
}
