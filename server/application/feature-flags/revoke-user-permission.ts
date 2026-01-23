/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext, AuditRequestContext } from "../context";
import type { User } from "@shared/schema";

export interface RevokeUserPermissionInput {
  admin: User;
  userId: string;
  permissionName: string;
  reason?: string;
}

export async function revokeUserPermission(
  ctx: AppContext,
  auditContext: AuditRequestContext,
  input: RevokeUserPermissionInput
): Promise<unknown> {
  const revoke = await ctx.storage.revokeUserPermission(
    input.userId,
    input.permissionName,
    input.admin.id,
    input.reason
  );

  await ctx.audit.logClinicianAction(auditContext, input.admin, "settings_change", {
    resourceType: "user",
    resourceId: input.userId,
    details: { action: "permission_revoke", permissionName: input.permissionName, targetUserId: input.userId },
    outcome: "success",
  });

  return revoke;
}
