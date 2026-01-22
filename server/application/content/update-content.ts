import type { ContentItem, InsertContentItem, User } from "@shared/schema";
import type { AppContext } from "../context";

export interface UpdateContentInput {
  clinician: User;
  contentId: string;
  updates: Partial<InsertContentItem>;
}

export async function updateContent(
  _ctx: AppContext,
  _input: UpdateContentInput
): Promise<ContentItem | null> {
  // TODO: update content and audit.
  throw new Error("updateContent not implemented");
}
