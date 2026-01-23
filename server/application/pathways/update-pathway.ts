/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import type { CarePathway, InsertCarePathway } from "@shared/schema";

export interface UpdatePathwayInput {
  pathwayId: string;
  updates: Partial<InsertCarePathway> & { isActive?: boolean };
}

export async function updatePathway(
  ctx: AppContext,
  input: UpdatePathwayInput
): Promise<CarePathway | null> {
  await ctx.storage.updateCarePathway(input.pathwayId, input.updates);
  return (await ctx.storage.getCarePathwayById(input.pathwayId)) ?? null;
}
