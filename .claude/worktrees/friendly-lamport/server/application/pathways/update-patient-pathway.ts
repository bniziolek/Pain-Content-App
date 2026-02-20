/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";

export interface UpdatePatientPathwayInput {
  patientPathwayId: string;
  updates: Record<string, unknown>;
}

export async function updatePatientPathway(
  ctx: AppContext,
  input: UpdatePatientPathwayInput
): Promise<unknown> {
  return ctx.storage.updatePatientPathway(input.patientPathwayId, input.updates);
}
