import type { AppContext } from "../context";
import type { CarePathway } from "@shared/schema";

export interface GetPathwayInput {
  pathwayId: string;
}

export async function getPathway(
  ctx: AppContext,
  input: GetPathwayInput
): Promise<CarePathway | null> {
  const pathway = await ctx.storage.getCarePathwayById(input.pathwayId);
  return pathway ?? null;
}
