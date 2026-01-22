import type { Request } from "express";
import type { AppContext } from "../context";
import type { User } from "@shared/schema";

export interface UpdateEmailDeliveryModeInput {
  clinician: User;
  mode: "central" | "personal";
}

export async function updateEmailDeliveryMode(
  ctx: AppContext,
  req: Request,
  input: UpdateEmailDeliveryModeInput
): Promise<void> {
  await ctx.storage.updateEmailDeliveryMode(input.clinician.id, input.mode);
  
  await ctx.audit.logClinicianAction(req, input.clinician, 'settings_change', {
    details: { setting: 'emailDeliveryMode', newValue: input.mode },
  });
}
