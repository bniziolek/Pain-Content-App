/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { ContentItem, InsertContentItem, User } from "@shared/schema";
import type { AppContext, AuditRequestContext } from "../context";

export interface UpdateContentInput {
  auditContext: AuditRequestContext;
  clinician: User;
  contentId: string;
  updates: Partial<InsertContentItem>;
}

export async function updateContent(
  ctx: AppContext,
  input: UpdateContentInput
): Promise<ContentItem | null> {
  const content = await ctx.storage.updateContent(input.contentId, input.updates);
  if (!content) {
    return null;
  }

  await ctx.audit.logClinicianAction(input.auditContext, input.clinician, 'content_update', {
    resourceType: 'content',
    resourceId: input.contentId,
    details: { title: content.title },
  });

  return content;
}
