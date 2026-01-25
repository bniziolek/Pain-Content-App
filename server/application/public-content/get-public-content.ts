/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import type { ContentItem } from "@shared/schema";

export interface GetPublicContentInput {
  emailLogId: string;
  contentId: string;
  accessCode?: string;
}

export interface GetPublicContentResult {
  content: ContentItem | null;
  emailLog: { patientEmail: string } | null;
}

export async function getPublicContent(
  ctx: AppContext,
  input: GetPublicContentInput
): Promise<GetPublicContentResult> {
  const emailLog = await ctx.storage.getEmailLogById(input.emailLogId);
  if (!emailLog) {
    return { content: null, emailLog: null };
  }
  
  // Read exclusively from database. Content is synced via `npm run contentful:sync`.
  const content = await ctx.storage.getContentById(input.contentId);
  
  return { 
    content: content ?? null, 
    emailLog: { patientEmail: emailLog.patientEmail }
  };
}
