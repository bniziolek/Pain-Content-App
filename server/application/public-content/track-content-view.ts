import type { Request } from "express";
import type { AppContext } from "../context";

export interface TrackContentViewInput {
  emailLogId: string;
  contentId: string;
  patientEmail: string;
}

export async function trackContentView(
  ctx: AppContext,
  req: Request,
  input: TrackContentViewInput
): Promise<void> {
  const existingViews = await ctx.storage.getContentViewsByEmailLogId(input.emailLogId);
  const existingView = existingViews.find(v => v.contentId === input.contentId);
  
  if (!existingView) {
    await ctx.storage.createContentView({
      emailLogId: input.emailLogId,
      contentId: input.contentId,
      patientEmail: input.patientEmail,
    });
    
    await ctx.audit.logPatientAction(req, input.patientEmail, 'content_view', {
      resourceType: 'content',
      resourceId: input.contentId,
      phiAccessed: true,
      phiScope: 'content view',
      details: { emailLogId: input.emailLogId },
    });
  }
}
