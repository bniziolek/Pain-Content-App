/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";

export async function getEnhancedAdminStats(ctx: AppContext): Promise<unknown> {
  return ctx.storage.getEnhancedAdminStats();
}
