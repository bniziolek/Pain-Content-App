/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import type { User } from "@shared/schema";

export interface GetUserInput {
  userId: string;
}

export async function getUser(
  ctx: AppContext,
  input: GetUserInput
): Promise<User | null> {
  const user = await ctx.storage.getUser(input.userId);
  return user ?? null;
}
