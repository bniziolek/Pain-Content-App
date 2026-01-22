import type { AppContext } from "../context";
import type { User } from "@shared/schema";

export interface GetContentStatusInput {
  clinician: User;
}

export async function getContentStatus(
  _ctx: AppContext,
  _input: GetContentStatusInput
): Promise<{ source: "contentful" | "database"; isContentfulConfigured: boolean }> {
  // TODO: report CMS status.
  throw new Error("getContentStatus not implemented");
}
