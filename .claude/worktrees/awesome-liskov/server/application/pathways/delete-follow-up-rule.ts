/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";

export interface DeleteFollowUpRuleInput {
  ruleId: string;
}

export async function deleteFollowUpRule(
  ctx: AppContext,
  input: DeleteFollowUpRuleInput
): Promise<void> {
  await ctx.storage.deleteFollowUpRule(input.ruleId);
}
