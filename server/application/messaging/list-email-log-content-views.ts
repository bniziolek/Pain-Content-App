import type { ContentView } from "@shared/schema";
import type { AppContext } from "../context";

export interface ListEmailLogContentViewsInput {
  emailLogId: string;
}

export async function listEmailLogContentViews(
  _ctx: AppContext,
  _input: ListEmailLogContentViewsInput
): Promise<ContentView[]> {
  // TODO: fetch content views for an email log.
  throw new Error("listEmailLogContentViews not implemented");
}
