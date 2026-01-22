import type { ContentView } from "@shared/schema";
import type { AppContext } from "../context";

export interface ListEmailLogContentViewsInput {
  emailLogId: string;
}

export async function listEmailLogContentViews(
  ctx: AppContext,
  input: ListEmailLogContentViewsInput
): Promise<ContentView[]> {
  return ctx.storage.getContentViewsByEmailLogId(input.emailLogId);
}
