import type { AppContext } from "../context";
import type { User } from "@shared/schema";

export interface DeleteEmailConnectionInput {
  clinician: User;
}

export async function deleteEmailConnection(
  _ctx: AppContext,
  _input: DeleteEmailConnectionInput
): Promise<void> {
  // TODO: remove stored email connection.
  throw new Error("deleteEmailConnection not implemented");
}
