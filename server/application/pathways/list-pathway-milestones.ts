/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";

export interface ListPathwayMilestonesInput {
  pathwayId: string;
}

export async function listPathwayMilestones(
  ctx: AppContext,
  input: ListPathwayMilestonesInput
): Promise<unknown[]> {
  return ctx.storage.getMilestonesByPathwayId(input.pathwayId);
}
