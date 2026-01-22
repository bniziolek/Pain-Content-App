import type { Request } from "express";
import type { AppContext } from "../context";

export interface AuthenticatePatientInput {
  email: string;
  accessCode: string;
}

export interface AuthenticatePatientResult {
  sessionToken: string;
  patientEmail: string;
}

export async function authenticatePatient(
  _ctx: AppContext,
  _req: Request,
  _input: AuthenticatePatientInput
): Promise<AuthenticatePatientResult> {
  // TODO: verify access code, update lockout, create session, audit.
  throw new Error("authenticatePatient not implemented");
}
