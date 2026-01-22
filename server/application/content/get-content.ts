import type { ContentItem, User } from "@shared/schema";
import type { AppContext } from "../context";

export interface GetContentInput {
  clinician: User;
  contentId: string;
}

export async function getContent(
  _ctx: AppContext,
  _input: GetContentInput
): Promise<ContentItem | null> {
  // TODO: fetch content with CMS fallback and audit access.
  throw new Error("getContent not implemented");
}
