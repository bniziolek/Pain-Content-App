import type { Request } from "express";
import type { AppContext } from "../context";
import type { User, AssessmentInvite, AssessmentResponse } from "@shared/schema";

export interface GetAssessmentInviteResultsInput {
  clinician: User;
  inviteId: string;
}

export interface AssessmentInviteResults {
  invite: AssessmentInvite;
  response: AssessmentResponse | null;
  scores?: Record<string, number>;
}

export async function getAssessmentInviteResults(
  ctx: AppContext,
  req: Request,
  input: GetAssessmentInviteResultsInput
): Promise<AssessmentInviteResults> {
  const invite = await ctx.storage.getAssessmentInviteById(input.inviteId);
  if (!invite) {
    throw new Error("Invite not found");
  }
  
  if (invite.clinicianUserId !== input.clinician.id) {
    throw new Error("Unauthorized");
  }
  
  const response = await ctx.storage.getAssessmentResponseByInviteId(input.inviteId);
  
  await ctx.audit.logClinicianAction(req, input.clinician, 'assessment_access', {
    resourceType: 'assessment',
    resourceId: input.inviteId,
    phiAccessed: true,
    phiScope: 'patient assessment responses',
    details: { 
      patientEmail: invite.patientEmail,
      hasResponse: !!response,
    },
  });
  
  const tagScores = response?.tagScores as Array<{ tag: string; score: number }> | null;
  const scoresRecord = tagScores?.reduce((acc, ts) => {
    acc[ts.tag] = ts.score;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    invite,
    response: response ?? null,
    scores: scoresRecord,
  };
}
