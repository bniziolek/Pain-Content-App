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
  let pathway: CarePathway | null = null;

  if (ctx.cms.isConfigured() && ctx.cms.getPathwayById) {
    try {
      pathway = (await ctx.cms.getPathwayById(input.pathwayId)) as CarePathway | null;
    } catch (error) {
      console.warn("CMS pathway fetch failed, falling back to database:", error);
    }
  }

  if (!pathway) {
    pathway = (await ctx.storage.getCarePathwayById(input.pathwayId)) ?? null;
  }

  if (!pathway) {
    return null;
  }

  const milestones = await ctx.storage.getMilestonesByPathwayId(input.pathwayId);
  return { pathway, milestones };
}
