import type { User } from "@shared/schema";
import type { AppContext } from "../context";

export interface DeleteRecommendationConfigInput {
  clinician: User;
  configId: string;
}

export async function deleteRecommendationConfig(
  _ctx: AppContext,
  _input: DeleteRecommendationConfigInput
): Promise<void> {
  // TODO: delete recommendation config and audit settings change.
  throw new Error("deleteRecommendationConfig not implemented");
}
