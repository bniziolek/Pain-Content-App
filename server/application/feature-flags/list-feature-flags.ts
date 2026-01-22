/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import type { FeatureFlag } from "@shared/schema";

export async function listFeatureFlags(ctx: AppContext): Promise<FeatureFlag[]> {
  return ctx.storage.getFeatureFlags();
}
