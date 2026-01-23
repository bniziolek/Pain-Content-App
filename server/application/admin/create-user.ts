/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import type { User } from "@shared/schema";
import { hashPassword } from "../../domain/password";

export interface CreateUserInput {
  email: string;
  name?: string;
  password?: string;
  role?: string;
}

export async function createUser(
  ctx: AppContext,
  input: CreateUserInput
): Promise<User> {
  const hashedPassword = await hashPassword(input.password || "changeme123");
  return ctx.storage.createUser({
    email: input.email.toLowerCase(),
    name: input.name,
    password: hashedPassword,
    role: input.role || "clinician",
    subscriptionStatus: "inactive",
  });
}
