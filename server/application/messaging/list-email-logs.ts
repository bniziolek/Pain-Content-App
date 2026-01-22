import type { EmailLog, User } from "@shared/schema";
import type { AppContext } from "../context";

export interface ListEmailLogsInput {
  clinician: User;
}

export async function listEmailLogs(
  ctx: AppContext,
  input: ListEmailLogsInput
): Promise<EmailLog[]> {
  return ctx.storage.getEmailLogsByClinicianId(input.clinician.id);
}
