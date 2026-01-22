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
  if (ctx.cms.isConfigured() && ctx.cms.getAllPathways) {
    try {
      return (await ctx.cms.getAllPathways()) as CarePathway[];
    } catch (error) {
      console.warn("CMS pathways fetch failed, falling back to database:", error);
    }
  }

  return ctx.storage.getCarePathways(input.clinician.id);
}
