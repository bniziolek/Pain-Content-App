/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import type { CarePathway, User } from "@shared/schema";

export interface ListPathwaysInput {
  clinician: User;
}

export async function listPathways(
  ctx: AppContext,
  input: ListPathwaysInput
): Promise<CarePathway[]> {
  // Read exclusively from database. Pathways are synced via `npm run contentful:sync`.
  return ctx.storage.getCarePathways(input.clinician.id);
}
