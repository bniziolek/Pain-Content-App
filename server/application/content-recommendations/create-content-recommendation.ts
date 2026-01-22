/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext, AuditRequestContext } from "../context";
import type { User } from "@shared/schema";

export interface CreateContentRecommendationInput {
  auditContext: AuditRequestContext;
  clinician: User;
  data: {
    tag: string;
    minScore?: number;
    maxScore?: number;
    contentId: string;
    priority?: number;
    rationale?: string;
  };
}

export async function createContentRecommendation(
  ctx: AppContext,
  input: CreateContentRecommendationInput
): Promise<unknown> {
  const recommendation = await ctx.storage.createContentRecommendation({
    tag: input.data.tag,
    minScore: input.data.minScore,
    maxScore: input.data.maxScore,
    contentId: input.data.contentId,
    priority: input.data.priority,
    rationale: input.data.rationale,
  });

  await ctx.audit.logClinicianAction(input.auditContext, input.clinician, "settings_change", {
    resourceType: "settings",
    details: { action: "create_content_recommendation", tag: input.data.tag, contentId: input.data.contentId },
  });

  return recommendation;
}
