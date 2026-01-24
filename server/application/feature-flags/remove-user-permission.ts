/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext, AuditRequestContext } from "../context";
import type { User } from "@shared/schema";

export interface RemoveUserPermissionInput {
  admin: User;
  userId: string;
  permissionOverrideId: string;
}

export async function removeUserPermission(
  ctx: AppContext,
  auditContext: AuditRequestContext,
  input: RemoveUserPermissionInput
): Promise<void> {
  await ctx.storage.removeUserPermission(input.permissionOverrideId);

  await ctx.audit.logClinicianAction(auditContext, input.admin, "settings_change", {
    resourceType: "user",
    resourceId: input.userId,
    details: {
      action: "permission_remove",
      permissionOverrideId: input.permissionOverrideId,
      targetUserId: input.userId,
    },
    outcome: "success",
  });
}
