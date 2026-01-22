import type { ContentItem, User } from "@shared/schema";
import type { AppContext } from "../context";

export interface ListContentInput {
  clinician: User;
}

export async function listContent(
  _ctx: AppContext,
  _input: ListContentInput
): Promise<ContentItem[]> {
  // TODO: fetch content with CMS fallback.
  throw new Error("listContent not implemented");
}
