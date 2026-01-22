import type { AppContext } from "../context";
import type { User } from "@shared/schema";

export interface GetContentUsageInput {
  clinician: User;
}

export interface ContentUsageStats {
  contentId: string;
  title: string;
  sendCount: number;
  viewCount: number;
}

export async function getContentUsage(
  ctx: AppContext,
  input: GetContentUsageInput
): Promise<ContentUsageStats[]> {
  const frequentContent = await ctx.storage.getFrequentlyUsedContent(input.clinician.id, 10);
  
  return frequentContent.map(item => ({
    contentId: item.contentId,
    title: item.title,
    sendCount: item.sendCount,
    viewCount: 0,
  }));
}
