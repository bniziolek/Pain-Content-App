/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import type { User } from "@shared/schema";

export interface GetContentStatusInput {
  clinician: User;
}

export async function getContentStatus(
  ctx: AppContext,
  _input: GetContentStatusInput
): Promise<{ source: "database"; isContentfulConfigured: boolean; syncAvailable: boolean }> {
  // Application always reads from database. Content is synced via `npm run contentful:sync`.
  const isConfigured = ctx.cms.isConfigured();
  return {
    source: "database",
    isContentfulConfigured: isConfigured,
    syncAvailable: isConfigured,
  };
}
