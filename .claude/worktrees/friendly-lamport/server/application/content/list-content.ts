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
  // Read exclusively from database. Content is synced via `npm run contentful:sync`.
  return ctx.storage.getAllContent();
}
