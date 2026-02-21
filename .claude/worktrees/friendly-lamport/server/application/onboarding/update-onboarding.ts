/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import type { User } from "@shared/schema";

export interface UpdateOnboardingInput {
  user: User;
  step?: number;
  completed?: boolean;
}

export interface OnboardingStatus {
  onboardingStep?: number | null;
  onboardingCompleted?: boolean | null;
}

export async function updateOnboarding(
  ctx: AppContext,
  input: UpdateOnboardingInput
): Promise<OnboardingStatus> {
  await ctx.storage.updateOnboardingStatus(input.user.id, {
    onboardingStep: input.step,
    onboardingCompleted: input.completed,
  });
  const user = await ctx.storage.getUser(input.user.id);

  return {
    onboardingStep: user?.onboardingStep ?? null,
    onboardingCompleted: user?.onboardingCompleted ?? null,
  };
}
