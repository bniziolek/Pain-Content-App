import type { Request } from "express";
import type { AssessmentInvite, User } from "@shared/schema";
import type { AppContext } from "../context";
import { insertAssessmentInviteSchema } from "@shared/schema";
import crypto from "crypto";

export interface CreateAssessmentInviteInput {
  clinician: User;
  assessmentId: string;
  patientEmail: string;
  patientName?: string;
}

export interface CreateAssessmentInviteResult {
  invite: AssessmentInvite;
}

export async function createAssessmentInvite(
  ctx: AppContext,
  req: Request,
  input: CreateAssessmentInviteInput
): Promise<CreateAssessmentInviteResult> {
  const token = crypto.randomBytes(32).toString("hex");
  
  const data = insertAssessmentInviteSchema.parse({
    assessmentId: input.assessmentId,
    patientEmail: input.patientEmail,
    patientName: input.patientName,
    clinicianUserId: input.clinician.id,
    token,
  });
  
  const invite = await ctx.storage.createAssessmentInvite(data);
  
  const baseUrl = process.env.REPLIT_DEV_DOMAIN
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : "http://localhost:5000";
  const assessmentLink = `${baseUrl}/assessment/${invite.token}`;

  await ctx.email.sendAssessmentInviteEmail({
    toEmail: invite.patientEmail,
    assessmentLink,
    clinicianName: input.clinician.name || undefined,
  });
  
  await ctx.audit.logClinicianAction(req, input.clinician, 'assessment_create', {
    resourceType: 'assessment',
    resourceId: invite.id,
    phiAccessed: true,
    phiScope: 'patient email, assessment invite',
    details: { patientEmail: invite.patientEmail },
  });
  
  return { invite };
}
