/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { InternalScreening, User } from "@shared/schema";
import type { AppContext, AuditRequestContext } from "../context";

export interface ListInternalScreeningsInput {
  auditContext: AuditRequestContext;
  clinician: User;
}

export async function listInternalScreenings(
  ctx: AppContext,
  input: ListInternalScreeningsInput
): Promise<InternalScreening[]> {
  const screenings = await ctx.storage.getInternalScreeningsByClinicianId(input.clinician.id);

  await ctx.audit.logClinicianAction(input.auditContext, input.clinician, 'assessment_access', {
    resourceType: 'screening',
    phiAccessed: true,
    phiScope: 'patient names in screening list',
    details: { count: screenings.length },
  });

  return screenings;
}
