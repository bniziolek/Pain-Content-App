/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { ContentItem, User } from "@shared/schema";
import type { AppContext, AuditRequestContext } from "../context";

export interface GetContentInput {
  auditContext: AuditRequestContext;
  clinician: User;
  contentId: string;
}

export async function getContent(
  ctx: AppContext,
  input: GetContentInput
): Promise<ContentItem | null> {
  // Read exclusively from database. Content is synced via `npm run contentful:sync`.
  const content: ContentItem | null = (await ctx.storage.getContentById(input.contentId)) ?? null;

  if (!content) {
    return null;
  }

  const isModerator = input.clinician.role === 'admin' || input.clinician.role === 'super_admin';
  if (!isModerator && content.moderationStatus !== 'approved') {
    return null;
  }

  await ctx.audit.logClinicianAction(input.auditContext, input.clinician, 'content_access', {
    resourceType: 'content',
    resourceId: input.contentId,
    details: { title: content.title },
  });

  return content;
}
