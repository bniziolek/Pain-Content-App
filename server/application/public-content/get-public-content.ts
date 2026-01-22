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
  
  let content = await ctx.storage.getContentById(input.contentId);
  
  if (!content && ctx.cms.isConfigured()) {
    const cmsContent = await ctx.cms.getContentById(input.contentId);
    content = cmsContent as ContentItem | null ?? undefined;
  }
  
  return { 
    content: content ?? null, 
    emailLog: { patientEmail: emailLog.patientEmail }
  };
}
