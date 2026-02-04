/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";

export interface DeletePathwayInput {
  pathwayId: string;
}

export async function deletePathway(
  ctx: AppContext,
  input: DeletePathwayInput
): Promise<void> {
  await ctx.storage.deleteCarePathway(input.pathwayId);
}
