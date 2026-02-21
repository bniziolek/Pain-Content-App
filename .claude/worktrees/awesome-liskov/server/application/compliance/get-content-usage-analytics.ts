/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import type { ContentUsageAnalytics } from "../../storage";

export async function getContentUsageAnalytics(ctx: AppContext): Promise<ContentUsageAnalytics> {
  return ctx.storage.getContentUsageAnalytics();
}
