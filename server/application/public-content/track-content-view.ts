/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext, AuditRequestContext } from "../context";

export interface TrackContentViewInput {
  emailLogId: string;
  contentId: string;
  patientEmail: string;
}

export async function trackContentView(
  ctx: AppContext,
  auditContext: AuditRequestContext,
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
    
    await ctx.audit.logPatientAction(auditContext, input.patientEmail, 'content_view', {
      resourceType: 'content',
      resourceId: input.contentId,
      phiAccessed: true,
      phiScope: 'content view',
      details: { emailLogId: input.emailLogId },
    });
  }
}
