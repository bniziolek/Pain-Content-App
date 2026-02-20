/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import type { Assessment, AssessmentInvite } from "@shared/schema";

export interface GetAssessmentInviteByTokenInput {
  token: string;
}

export interface AssessmentInviteWithAssessment {
  invite: AssessmentInvite;
  assessment: Assessment | null;
}

export async function getAssessmentInviteByToken(
  ctx: AppContext,
  input: GetAssessmentInviteByTokenInput
): Promise<AssessmentInviteWithAssessment | null> {
  const invite = await ctx.storage.getAssessmentInviteByToken(input.token);
  if (!invite) {
    return null;
  }

  const assessment = await ctx.storage.getAssessmentById(invite.assessmentId);
  return { invite, assessment: assessment ?? null };
}
