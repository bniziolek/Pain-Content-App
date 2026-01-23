/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import type { User } from "@shared/schema";

export interface ListFollowUpRulesInput {
  clinician: User;
}

export async function listFollowUpRules(
  ctx: AppContext,
  input: ListFollowUpRulesInput
): Promise<unknown[]> {
  return ctx.storage.getFollowUpRulesByClinicianId(input.clinician.id);
}
