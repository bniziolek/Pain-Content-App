/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import type { PermissionName } from "../../rbac-policy";

export interface CheckUserPermissionInput {
  userId: string;
  userRole: string;
  permissionName: PermissionName;
}

export async function checkUserPermission(
  ctx: AppContext,
  input: CheckUserPermissionInput
): Promise<boolean> {
  if (input.userRole === "super_admin") {
    return true;
  }

  const userOverride = await ctx.storage.getUserPermissionOverride(
    input.userId,
    input.permissionName
  );
  if (userOverride !== null) {
    return userOverride;
  }

  return ctx.storage.hasPermission(input.userRole, input.permissionName);
}
