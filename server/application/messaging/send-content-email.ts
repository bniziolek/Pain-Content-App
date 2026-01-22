import type { Request } from "express";
import type { EmailLog, User } from "@shared/schema";
import type { AppContext } from "../context";

export interface SendContentEmailInput {
  clinician: User;
  patientEmail: string;
  subject: string;
  contentIds: string[];
  providerNote?: string;
  type?: string;
}

export interface SendContentEmailResult {
  emailLog: EmailLog;
  accessCode: string;
}

export async function sendContentEmailFlow(
  _ctx: AppContext,
  _req: Request,
  _input: SendContentEmailInput
): Promise<SendContentEmailResult> {
  // TODO: orchestrate access code generation, storage, email provider, audit log.
  throw new Error("sendContentEmailFlow not implemented");
}
