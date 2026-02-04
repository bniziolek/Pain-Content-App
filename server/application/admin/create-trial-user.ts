/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import type { User } from "@shared/schema";
import { hashPassword } from "../../domain/password";

export interface CreateTrialUserInput {
  email: string;
  name?: string;
}

export async function createTrialUser(
  ctx: AppContext,
  input: CreateTrialUserInput
): Promise<User> {
  const normalizedEmail = input.email.toLowerCase();
  const existing = await ctx.storage.getUserByEmail(normalizedEmail);

  if (existing) {
    await ctx.storage.updateUserSubscription(existing.id, {
      subscriptionStatus: "active",
      subscriptionPeriodEnd: new Date("9999-12-31"),
    });
    const updated = await ctx.storage.getUser(existing.id);
    if (!updated) {
      throw new Error("Failed to retrieve updated user");
    }
    return updated;
  }

  const hashedPassword = await hashPassword("changeme123");
  return ctx.storage.createUser({
    email: normalizedEmail,
    name: input.name || normalizedEmail.split("@")[0],
    password: hashedPassword,
    role: "clinician",
    subscriptionStatus: "active",
    subscriptionPeriodEnd: new Date("9999-12-31"),
  });
}
