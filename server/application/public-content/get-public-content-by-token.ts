/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import type { ContentItem } from "@shared/schema";

export interface GetPublicContentByTokenInput {
  token: string;
}

export interface GetPublicContentByTokenResult {
  content: ContentItem | null;
  viewToken: string | null;
}

export async function getPublicContentByToken(
  ctx: AppContext,
  input: GetPublicContentByTokenInput
): Promise<GetPublicContentByTokenResult> {
  const view = await ctx.storage.getContentViewByToken(input.token);
  if (!view) {
    return { content: null, viewToken: null };
  }

  if (!view.viewedAt) {
    await ctx.storage.updateContentView(view.id, { viewedAt: new Date() });
    await ctx.storage.updateEmailLogStatus(view.emailLogId, "clicked");
  }

  // Read exclusively from database. Content is synced via `npm run contentful:sync`.
  const content: ContentItem | null = (await ctx.storage.getContentById(view.contentId)) ?? null;

  return {
    content: content ?? null,
    viewToken: view.token,
  };
}
