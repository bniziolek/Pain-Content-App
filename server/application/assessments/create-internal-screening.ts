import type { InternalScreening, InsertInternalScreening, User } from "@shared/schema";
import type { AppContext } from "../context";

export interface CreateInternalScreeningInput {
  clinician: User;
  data: InsertInternalScreening;
}

export async function createInternalScreening(
  _ctx: AppContext,
  _input: CreateInternalScreeningInput
): Promise<InternalScreening> {
  // TODO: create screening and audit PHI access.
  throw new Error("createInternalScreening not implemented");
}
