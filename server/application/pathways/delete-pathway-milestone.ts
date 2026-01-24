/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";

export interface DeletePathwayMilestoneInput {
  milestoneId: string;
}

export async function deletePathwayMilestone(
  ctx: AppContext,
  input: DeletePathwayMilestoneInput
): Promise<void> {
  await ctx.storage.deletePathwayMilestone(input.milestoneId);
}
