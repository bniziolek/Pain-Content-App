import type { AppContext } from "../context";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

export interface ResetPasswordResult {
  success: boolean;
  error?: string;
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function resetPassword(
  ctx: AppContext,
  input: ResetPasswordInput
): Promise<ResetPasswordResult> {
  const resetToken = await ctx.storage.getPasswordResetToken(input.token);
  
  if (!resetToken) {
    return { success: false, error: "Invalid token" };
  }
  
  if (resetToken.usedAt !== null) {
    return { success: false, error: "Token already used" };
  }
  
  if (new Date(resetToken.expiresAt) < ctx.now()) {
    return { success: false, error: "Token expired" };
  }
  
  const hashedPassword = await hashPassword(input.newPassword);
  await ctx.storage.updateUserPassword(resetToken.userId, hashedPassword);
  await ctx.storage.markPasswordResetTokenUsed(input.token);
  
  return { success: true };
}
