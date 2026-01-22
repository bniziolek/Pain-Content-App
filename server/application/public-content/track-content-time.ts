/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";

export interface TrackContentTimeInput {
  viewId: string;
  timeSpentSeconds: number;
}

export async function trackContentTime(
  ctx: AppContext,
  input: TrackContentTimeInput
): Promise<void> {
  await ctx.storage.updateContentView(input.viewId, {
    timeSpentSeconds: input.timeSpentSeconds,
  });
}
