import type { InternalScreening, User } from "@shared/schema";
import type { AppContext } from "../context";

export interface ListInternalScreeningsInput {
  clinician: User;
}

export async function listInternalScreenings(
  _ctx: AppContext,
  _input: ListInternalScreeningsInput
): Promise<InternalScreening[]> {
  // TODO: list screenings and audit access.
  throw new Error("listInternalScreenings not implemented");
}
