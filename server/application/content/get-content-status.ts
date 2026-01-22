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
): Promise<{ source: "contentful" | "database"; isContentfulConfigured: boolean }> {
  const isConfigured = ctx.cms.isConfigured();
  return {
    source: isConfigured ? "contentful" : "database",
    isContentfulConfigured: isConfigured,
  };
}
