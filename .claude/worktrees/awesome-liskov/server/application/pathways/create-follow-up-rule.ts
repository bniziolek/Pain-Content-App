/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import type { User } from "@shared/schema";

export interface CreateFollowUpRuleInput {
  clinician: User;
  data: {
    name: string;
    triggerType: string;
    triggerDays: number;
    action: string;
    contentIds?: string[];
    message?: string;
    isTemplate?: boolean;
  };
}

export async function createFollowUpRule(
  ctx: AppContext,
  input: CreateFollowUpRuleInput
): Promise<unknown> {
  return ctx.storage.createFollowUpRule({
    clinicianUserId: input.clinician.id,
    name: input.data.name,
    triggerType: input.data.triggerType,
    triggerDays: input.data.triggerDays,
    action: input.data.action,
    contentIds: input.data.contentIds,
    message: input.data.message,
  });
}
