import type { AppContext } from "../context";
import type { User } from "@shared/schema";

export interface UpdateEmailDeliveryModeInput {
  clinician: User;
  mode: "central" | "personal";
}

export async function updateEmailDeliveryMode(
  _ctx: AppContext,
  _input: UpdateEmailDeliveryModeInput
): Promise<void> {
  // TODO: update delivery mode for clinician.
  throw new Error("updateEmailDeliveryMode not implemented");
}
