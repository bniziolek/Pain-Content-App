/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { User } from "@shared/schema";
import type { AppContext, AuditRequestContext } from "../context";

export interface DeleteContentInput {
  auditContext: AuditRequestContext;
  clinician: User;
  contentId: string;
}

export async function deleteContent(
  ctx: AppContext,
  input: DeleteContentInput
): Promise<void> {
  await ctx.audit.logClinicianAction(input.auditContext, input.clinician, 'content_delete', {
    resourceType: 'content',
    resourceId: input.contentId,
  });

  await ctx.storage.deleteContent(input.contentId);
}
