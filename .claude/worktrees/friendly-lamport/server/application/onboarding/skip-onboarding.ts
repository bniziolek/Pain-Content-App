/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import type { User } from "@shared/schema";

export interface SkipOnboardingInput {
  user: User;
}

export async function skipOnboarding(
  ctx: AppContext,
  input: SkipOnboardingInput
): Promise<void> {
  await ctx.storage.updateOnboardingStatus(input.user.id, {
    onboardingCompleted: true,
  });
}
