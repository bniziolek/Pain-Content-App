/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { ContentItem, InsertContentItem, User } from "@shared/schema";
import type { AppContext, AuditRequestContext } from "../context";

export interface CreateContentInput {
  auditContext: AuditRequestContext;
  clinician: User;
  data: InsertContentItem;
}

export async function createContent(
  ctx: AppContext,
  input: CreateContentInput
): Promise<ContentItem> {
  const content = await ctx.storage.createContent(input.data);

  await ctx.audit.logClinicianAction(input.auditContext, input.clinician, 'content_create', {
    resourceType: 'content',
    resourceId: content.id,
    details: { title: content.title },
  });

  return content;
}
