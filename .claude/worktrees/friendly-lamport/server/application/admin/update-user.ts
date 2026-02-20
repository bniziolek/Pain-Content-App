/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import type { User } from "@shared/schema";

export interface UpdateUserInput {
  userId: string;
  updates: {
    name?: string;
    email?: string;
    role?: string;
    phone?: string;
    clinicName?: string;
    credentials?: string;
    address?: string;
  };
}

export async function updateUser(
  ctx: AppContext,
  input: UpdateUserInput
): Promise<User | null> {
  await ctx.storage.updateUser(input.userId, input.updates);
  return (await ctx.storage.getUser(input.userId)) ?? null;
}
