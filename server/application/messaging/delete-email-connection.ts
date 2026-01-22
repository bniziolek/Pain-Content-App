import type { Request } from "express";
import type { AppContext } from "../context";
import type { User } from "@shared/schema";

export interface DeleteEmailConnectionInput {
  clinician: User;
}

export async function deleteEmailConnection(
  ctx: AppContext,
  req: Request,
  input: DeleteEmailConnectionInput
): Promise<void> {
  await ctx.audit.logClinicianAction(req, input.clinician, 'settings_change', {
    details: { setting: 'emailConnection', action: 'deleted' },
  });
}
