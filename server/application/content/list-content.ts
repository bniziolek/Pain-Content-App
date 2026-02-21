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
  input: ListContentInput
): Promise<ContentItem[]> {
  // Read exclusively from database. Content is synced via `npm run contentful:sync`.
  const all = await ctx.storage.getAllContent();
  const isModerator = input.clinician.role === 'admin' || input.clinician.role === 'super_admin';
  return isModerator ? all : all.filter(item => item.moderationStatus === 'approved');
}
