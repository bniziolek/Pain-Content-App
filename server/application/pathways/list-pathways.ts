import type { AppContext } from "../context";
import type { CarePathway } from "@shared/schema";

export async function listPathways(ctx: AppContext): Promise<CarePathway[]> {
  return ctx.storage.getCarePathways();
}
