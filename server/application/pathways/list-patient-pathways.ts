/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import type { User } from "@shared/schema";

export interface ListPatientPathwaysInput {
  clinician: User;
}

export async function listPatientPathways(
  ctx: AppContext,
  input: ListPatientPathwaysInput
): Promise<unknown[]> {
  return ctx.storage.getPatientPathwaysByClinicianId(input.clinician.id);
}
