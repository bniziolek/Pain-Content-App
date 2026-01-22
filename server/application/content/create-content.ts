import type { ContentItem, InsertContentItem, User } from "@shared/schema";
import type { AppContext } from "../context";

export interface CreateContentInput {
  clinician: User;
  data: InsertContentItem;
}

export async function createContent(
  _ctx: AppContext,
  _input: CreateContentInput
): Promise<ContentItem> {
  // TODO: create content and audit.
  throw new Error("createContent not implemented");
}
