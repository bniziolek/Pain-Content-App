import type { User } from "@shared/schema";
import type { AppContext } from "../context";

export interface DeleteContentInput {
  clinician: User;
  contentId: string;
}

export async function deleteContent(
  _ctx: AppContext,
  _input: DeleteContentInput
): Promise<void> {
  // TODO: delete content and audit.
  throw new Error("deleteContent not implemented");
}
