/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { ContentItem, User } from "@shared/schema";
import type { AppContext } from "../context";

export interface ListContentInput {
  clinician: User;
}

export async function listContent(
  ctx: AppContext,
  _input: ListContentInput
): Promise<ContentItem[]> {
  if (ctx.cms.isConfigured()) {
    try {
      return (await ctx.cms.getAllContent()) as ContentItem[];
    } catch (error) {
      console.warn("CMS fetch failed, falling back to database:", error);
    }
  }

  return ctx.storage.getAllContent();
}
