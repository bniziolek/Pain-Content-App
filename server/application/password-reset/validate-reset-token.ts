import type { AppContext } from "../context";

export interface ValidateResetTokenInput {
  token: string;
}

export interface ValidateResetTokenResult {
  valid: boolean;
  userId?: string;
}

export async function validateResetToken(
  ctx: AppContext,
  input: ValidateResetTokenInput
): Promise<ValidateResetTokenResult> {
  const resetToken = await ctx.storage.getPasswordResetToken(input.token);
  
  if (!resetToken) {
    return { valid: false };
  }
  
  if (resetToken.usedAt !== null) {
    return { valid: false };
  }
  
  if (new Date(resetToken.expiresAt) < ctx.now()) {
    return { valid: false };
  }
  
  return { valid: true, userId: resetToken.userId };
}
