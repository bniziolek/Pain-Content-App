import type { User } from "@shared/schema";
import type { AppContext } from "../context";

export interface GetFrequentlyUsedContentInput {
  clinician: User;
  limit?: number;
}

export async function getFrequentlyUsedContent(
  _ctx: AppContext,
  _input: GetFrequentlyUsedContentInput
): Promise<Array<{ contentId: string; title: string; sendCount: number }>> {
  // TODO: fetch frequently used content for clinician.
  throw new Error("getFrequentlyUsedContent not implemented");
}
