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
  const isModerator = input.clinician.role === 'admin' || input.clinician.role === 'super_admin';
  const content = await ctx.storage.createContent({
    ...input.data,
    clinicianUserId: input.clinician.id,
    moderationStatus: isModerator ? 'approved' : 'pending',
    submittedAt: new Date(),
  });

  await ctx.audit.logClinicianAction(input.auditContext, input.clinician, 'content_create', {
    resourceType: 'content',
    resourceId: content.id,
    details: { title: content.title },
  });

  return content;
}
