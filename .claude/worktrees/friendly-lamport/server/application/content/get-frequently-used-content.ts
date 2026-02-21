/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { User } from "@shared/schema";
import type { AppContext } from "../context";

export interface GetFrequentlyUsedContentInput {
  clinician: User;
  limit?: number;
}

export async function getFrequentlyUsedContent(
  ctx: AppContext,
  input: GetFrequentlyUsedContentInput
): Promise<Array<{ contentId: string; title: string; sendCount: number }>> {
  return ctx.storage.getFrequentlyUsedContent(input.clinician.id, input.limit ?? 5);
}
