/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";

export interface UpdatePathwayMilestoneInput {
  milestoneId: string;
  updates: Record<string, unknown>;
}

export async function updatePathwayMilestone(
  ctx: AppContext,
  input: UpdatePathwayMilestoneInput
): Promise<unknown> {
  return ctx.storage.updatePathwayMilestone(input.milestoneId, input.updates);
}
