import type { Request } from "express";
import type { EmailLog, User } from "@shared/schema";
import type { AppContext } from "../context";

export interface ResendContentEmailInput {
  clinician: User;
  emailLogId: string;
  providerNote?: string;
}

export interface ResendContentEmailResult {
  emailLog: EmailLog;
  accessCode: string;
}

export async function resendContentEmailFlow(
  _ctx: AppContext,
  _req: Request,
  _input: ResendContentEmailInput
): Promise<ResendContentEmailResult> {
  // TODO: load original log, create follow-up log, send email, audit.
  throw new Error("resendContentEmailFlow not implemented");
}
