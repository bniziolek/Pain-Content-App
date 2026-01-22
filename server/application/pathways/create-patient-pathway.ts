/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext, AuditRequestContext } from "../context";
import type { User } from "@shared/schema";

export interface CreatePatientPathwayInput {
  auditContext: AuditRequestContext;
  clinician: User;
  data: {
    pathwayId: string;
    patientEmail: string;
    patientName?: string;
    startDate: Date;
    notes?: string;
  };
}

export async function createPatientPathway(
  ctx: AppContext,
  input: CreatePatientPathwayInput
): Promise<unknown> {
  const patientPathway = await ctx.storage.createPatientPathway({
    clinicianUserId: input.clinician.id,
    pathwayId: input.data.pathwayId,
    patientEmail: input.data.patientEmail,
    patientName: input.data.patientName,
    startDate: input.data.startDate,
    notes: input.data.notes,
  });

  await ctx.audit.logClinicianAction(input.auditContext, input.clinician, 'content_create', {
    resourceType: 'patient',
    resourceId: patientPathway.id,
    phiAccessed: true,
    phiScope: 'patient pathway enrollment',
    details: { patientEmail: input.data.patientEmail, pathwayId: input.data.pathwayId },
  });

  return patientPathway;
}
