/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext, AuditRequestContext } from "../context";
import type { User } from "@shared/schema";

export interface GrantUserPermissionInput {
  admin: User;
  userId: string;
  permissionName: string;
  reason?: string;
  expiresAt?: Date;
}

export async function grantUserPermission(
  ctx: AppContext,
  auditContext: AuditRequestContext,
  input: GrantUserPermissionInput
): Promise<unknown> {
  const grant = await ctx.storage.grantUserPermission(
    input.userId,
    input.permissionName,
    input.admin.id,
    input.reason,
    input.expiresAt
  );

  await ctx.audit.logClinicianAction(auditContext, input.admin, "settings_change", {
    resourceType: "user",
    resourceId: input.userId,
    details: { action: "permission_grant", permissionName: input.permissionName, targetUserId: input.userId },
    outcome: "success",
  });

  return grant;
}
