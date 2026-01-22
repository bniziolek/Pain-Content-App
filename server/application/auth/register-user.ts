/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext, AuditRequestContext } from "../context";
import type { User } from "@shared/schema";
import { AppError } from "../errors";
import { hashPassword } from "../../domain/password";

export interface RegisterUserInput {
  email: string;
  password: string;
  name?: string | null;
}

export async function registerUser(
  ctx: AppContext,
  auditContext: AuditRequestContext,
  input: RegisterUserInput
): Promise<User> {
  const normalizedEmail = input.email.toLowerCase();
  const existingUser = await ctx.storage.getUserByEmail(normalizedEmail);
  if (existingUser) {
    throw new AppError(400, "Email already exists");
  }

  const user = await ctx.storage.createUser({
    email: normalizedEmail,
    password: await hashPassword(input.password),
    name: input.name || null,
  });

  await ctx.audit.logClinicianAction(auditContext, user, "user_create", {
    resourceType: "user",
    resourceId: user.id,
    details: { method: "self_registration" },
  });

  return user;
}
