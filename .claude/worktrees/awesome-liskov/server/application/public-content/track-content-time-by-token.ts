/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";

export interface TrackContentTimeByTokenInput {
  token: string;
  timeSpentSeconds: number;
}

export async function trackContentTimeByToken(
  ctx: AppContext,
  input: TrackContentTimeByTokenInput
): Promise<boolean> {
  const view = await ctx.storage.getContentViewByToken(input.token);
  if (!view) {
    return false;
  }

  if (input.timeSpentSeconds > 0) {
    await ctx.storage.updateContentView(view.id, { timeSpentSeconds: input.timeSpentSeconds });
  }

  return true;
}
