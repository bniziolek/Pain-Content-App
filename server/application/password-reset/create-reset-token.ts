import type { AppContext } from "../context";
import crypto from "crypto";

export interface CreateResetTokenInput {
  email: string;
}

export interface CreateResetTokenResult {
  token: string;
  expiresAt: Date;
}

export async function createResetToken(
  ctx: AppContext,
  input: CreateResetTokenInput
): Promise<CreateResetTokenResult | null> {
  const user = await ctx.storage.getUserByEmail(input.email);
  if (!user) {
    return null;
  }
  
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(ctx.now().getTime() + 60 * 60 * 1000);
  
  await ctx.storage.createPasswordResetToken(user.id, token, expiresAt);
  
  return { token, expiresAt };
}
