/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext, AuditRequestContext } from "../context";
import type { CarePathway, User } from "@shared/schema";

export interface CreatePathwayInput {
  auditContext: AuditRequestContext;
  clinician: User;
  data: {
    name: string;
    description?: string;
    condition?: string;
    durationWeeks?: number;
    isTemplate?: boolean;
  };
}

export async function createPathway(
  ctx: AppContext,
  input: CreatePathwayInput
): Promise<CarePathway> {
  const pathway = await ctx.storage.createCarePathway({
    clinicianUserId: input.clinician.id,
    name: input.data.name,
    description: input.data.description,
    condition: input.data.condition,
    durationWeeks: input.data.durationWeeks,
    isTemplate: input.data.isTemplate ?? false,
  });

  await ctx.audit.logClinicianAction(input.auditContext, input.clinician, 'content_create', {
    resourceType: 'content',
    resourceId: pathway.id,
    details: { type: 'care_pathway', name: pathway.name },
  });

  return pathway;
}
