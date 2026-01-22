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
  let content: ContentItem | null = (await ctx.storage.getContentById(input.contentId)) ?? null;

  if (!content && ctx.cms.isConfigured()) {
    try {
      content = (await ctx.cms.getContentById(input.contentId)) as ContentItem | null;
    } catch (error) {
      console.warn("CMS fetch failed, falling back to database:", error);
    }
  }

  if (content) {
    await ctx.audit.logClinicianAction(input.auditContext, input.clinician, 'content_access', {
      resourceType: 'content',
      resourceId: input.contentId,
      details: { title: content.title },
    });
  }

  return content;
}
