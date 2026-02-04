/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import type { FeatureFlagHistoryEntry } from "../../storage";

export async function listFeatureFlagHistory(ctx: AppContext): Promise<FeatureFlagHistoryEntry[]> {
  return ctx.storage.getFeatureFlagHistory();
}
