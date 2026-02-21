/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { InternalScreening, InsertInternalScreening, User } from "@shared/schema";
import type { AppContext, AuditRequestContext } from "../context";

export interface CreateInternalScreeningInput {
  auditContext: AuditRequestContext;
  clinician: User;
  data: InsertInternalScreening;
}

export async function createInternalScreening(
  ctx: AppContext,
  input: CreateInternalScreeningInput
): Promise<InternalScreening> {
  const screening = await ctx.storage.createInternalScreening(input.data);

  await ctx.audit.logClinicianAction(input.auditContext, input.clinician, 'assessment_create', {
    resourceType: 'screening',
    resourceId: screening.id,
    phiAccessed: true,
    phiScope: 'patient name, screening results',
    details: { patientName: screening.patientName },
  });

  return screening;
}
