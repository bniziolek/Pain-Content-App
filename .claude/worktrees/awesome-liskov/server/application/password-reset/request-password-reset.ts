/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import { createResetToken } from "./create-reset-token";

export interface RequestPasswordResetInput {
  email: string;
  baseUrl: string;
}

export async function requestPasswordReset(
  ctx: AppContext,
  input: RequestPasswordResetInput
): Promise<void> {
  const tokenResult = await createResetToken(ctx, { email: input.email.toLowerCase() });
  if (!tokenResult) {
    return;
  }

  if (!ctx.email.sendPasswordResetEmail) {
    throw new Error("Email service not configured for password resets");
  }

  const baseUrl = process.env.REPLIT_DEV_DOMAIN 
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : process.env.REPLIT_DOMAINS 
      ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
      : input.baseUrl;
  const resetLink = `${baseUrl}/forgot-password?token=${encodeURIComponent(tokenResult.token)}`;

  await ctx.email.sendPasswordResetEmail({
    toEmail: input.email,
    resetLink,
  });
}
