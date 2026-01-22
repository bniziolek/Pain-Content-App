import type { EmailLog, User } from "@shared/schema";
import type { AppContext } from "../context";

export interface ListEmailLogsInput {
  clinician: User;
}

export async function listEmailLogs(
  _ctx: AppContext,
  _input: ListEmailLogsInput
): Promise<EmailLog[]> {
  // TODO: list email logs for clinician.
  throw new Error("listEmailLogs not implemented");
}
