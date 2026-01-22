import type { Request } from "express";
import type { AppContext } from "../context";
import { AppError } from "../errors";

export interface ListPatientContentInput {
  req: Request;
  sessionToken: string;
}

export interface PatientContentSummary {
  content: unknown[];
  assessments: Array<{ id: string; token: string; status: string; createdAt: Date }>;
}

export async function listPatientContent(
  ctx: AppContext,
  input: ListPatientContentInput
): Promise<PatientContentSummary> {
  const session = await ctx.storage.getPatientSessionByToken(input.sessionToken);
  if (!session) {
    throw new AppError(401, "Session expired or invalid", { error: "Session expired or invalid" });
  }

  if (session.expiresAt < ctx.now()) {
    await ctx.storage.invalidatePatientSession(input.sessionToken);
    throw new AppError(401, "Session expired", { error: "Session expired" });
  }

  await ctx.storage.updatePatientSessionActivity(input.sessionToken);

  const emailLog = await ctx.storage.getEmailLogById(session.emailLogId);
  const contentViews = await ctx.storage.getContentViewsByEmailLogId(session.emailLogId);

  const contentMap: Record<string, any> = {};
  for (const view of contentViews) {
    let content: any = null;
    if (ctx.cms.isConfigured()) {
      try {
        content = await ctx.cms.getContentById(view.contentId);
      } catch (error) {
        console.warn("CMS fetch failed:", error);
      }
    }
    if (!content) {
      content = await ctx.storage.getContentById(view.contentId);
    }

    if (content && !contentMap[view.contentId]) {
      contentMap[view.contentId] = {
        id: content.id,
        title: content.title,
        summary: content.summary,
        readTime: content.readTime,
        viewToken: view.token,
        viewedAt: view.viewedAt,
        assignedAt: emailLog?.sentAt,
        providerNote: emailLog?.providerNote,
      };
    }
  }

  const clinicianId = emailLog?.clinicianUserId;
  const assessmentInvites = clinicianId
    ? await ctx.storage.getAssessmentInvitesByPatientEmail(clinicianId, session.patientEmail)
    : [];

  await ctx.audit.logPatientAction(input.req, session.patientEmail, "content_view", {
    resourceType: "content",
    phiAccessed: true,
    phiScope: "patient educational content",
    sessionId: input.sessionToken,
  });

  return {
    content: Object.values(contentMap),
    assessments: assessmentInvites.map((invite) => ({
      id: invite.id,
      token: invite.token,
      status: invite.status,
      createdAt: invite.createdAt,
    })),
  };
}
