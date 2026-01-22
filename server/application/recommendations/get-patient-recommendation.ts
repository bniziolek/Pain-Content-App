/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import type { PatientRecommendation } from "@shared/schema";

export interface GetPatientRecommendationInput {
  recommendationId: string;
}

export async function getPatientRecommendation(
  ctx: AppContext,
  input: GetPatientRecommendationInput
): Promise<PatientRecommendation | null> {
  return (await ctx.storage.getPatientRecommendationById(input.recommendationId)) ?? null;
}
