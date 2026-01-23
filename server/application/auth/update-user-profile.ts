/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext, AuditRequestContext } from "../context";
import type { User } from "@shared/schema";
import { AppError } from "../errors";

export interface UpdateUserProfileInput {
  userId: string;
  updates: {
    name?: string;
    email?: string;
    phone?: string;
    clinicName?: string;
    credentials?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
}

export async function updateUserProfile(
  ctx: AppContext,
  auditContext: AuditRequestContext,
  input: UpdateUserProfileInput
): Promise<User> {
  const { userId, updates } = input;

  const existingUser = await ctx.storage.getUser(userId);
  if (!existingUser) {
    throw new AppError(404, "User not found");
  }

  if (updates.email && updates.email !== existingUser.email) {
    const normalizedEmail = updates.email.toLowerCase();
    const emailExists = await ctx.storage.getUserByEmail(normalizedEmail);
    if (emailExists && emailExists.id !== userId) {
      throw new AppError(400, "Email is already in use by another account");
    }
    updates.email = normalizedEmail;
  }

  await ctx.storage.updateUser(userId, updates);

  const updatedUser = await ctx.storage.getUser(userId);
  if (!updatedUser) {
    throw new AppError(500, "Failed to retrieve updated user");
  }

  const changedFields = Object.keys(updates).filter(
    (key) => updates[key as keyof typeof updates] !== undefined
  );

  await ctx.audit.logClinicianAction(auditContext, updatedUser, "user_update", {
    resourceType: "user",
    resourceId: userId,
    details: { 
      changedFields,
      emailChanged: updates.email && updates.email !== existingUser.email,
    },
  });

  return updatedUser;
}
