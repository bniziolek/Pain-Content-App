/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { RecommendationConfig, User } from "@shared/schema";
import type { AppContext } from "../context";

export interface ListRecommendationConfigsInput {
  clinician: User;
  assessmentId?: string;
  pathwayId?: string;
}

export async function listRecommendationConfigs(
  ctx: AppContext,
  input: ListRecommendationConfigsInput
): Promise<RecommendationConfig[]> {
  return ctx.storage.getRecommendationConfigs({
    clinicianId: input.clinician.id,
    assessmentId: input.assessmentId,
    pathwayId: input.pathwayId,
  });
}
