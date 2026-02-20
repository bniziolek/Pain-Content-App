/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import type { CarePathway } from "@shared/schema";

export interface GetPathwayInput {
  pathwayId: string;
}

export interface GetPathwayResult {
  pathway: CarePathway;
  milestones: unknown[];
}

export async function getPathway(
  ctx: AppContext,
  input: GetPathwayInput
): Promise<GetPathwayResult | null> {
  // Read exclusively from database. Pathways are synced via `npm run contentful:sync`.
  const pathway: CarePathway | null = (await ctx.storage.getCarePathwayById(input.pathwayId)) ?? null;

  if (!pathway) {
    return null;
  }

  const milestones = await ctx.storage.getMilestonesByPathwayId(input.pathwayId);
  return { pathway, milestones };
}
