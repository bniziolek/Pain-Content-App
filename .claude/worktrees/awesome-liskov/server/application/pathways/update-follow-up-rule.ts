/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";

export interface UpdateFollowUpRuleInput {
  ruleId: string;
  updates: Record<string, unknown>;
}

export async function updateFollowUpRule(
  ctx: AppContext,
  input: UpdateFollowUpRuleInput
): Promise<unknown> {
  return ctx.storage.updateFollowUpRule(input.ruleId, input.updates);
}
