/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import type { FeatureFlagHistoryEntry } from "../../storage";

export interface ListFeatureFlagHistoryByKeyInput {
  key: string;
}

export async function listFeatureFlagHistoryByKey(
  ctx: AppContext,
  input: ListFeatureFlagHistoryByKeyInput
): Promise<FeatureFlagHistoryEntry[]> {
  return ctx.storage.getFeatureFlagHistoryByKey(input.key);
}
