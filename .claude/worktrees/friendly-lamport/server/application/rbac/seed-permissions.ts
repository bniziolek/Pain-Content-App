/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import { createAppContext } from "../context-helpers";
import { DEFAULT_PERMISSIONS, ROLE_PERMISSIONS } from "../../rbac-policy";

export async function seedPermissions(ctx: AppContext = createAppContext()): Promise<void> {
  const existingPermissions = await ctx.storage.getPermissions();

  for (const perm of DEFAULT_PERMISSIONS) {
    const exists = existingPermissions.find((p) => p.name === perm.name);
    if (!exists) {
      const created = await ctx.storage.createPermission(perm);
      console.log(`[RBAC] Created permission: ${perm.name}`);

      for (const [role, permissions] of Object.entries(ROLE_PERMISSIONS)) {
        if (permissions.includes(perm.name)) {
          await ctx.storage.assignPermissionToRole(role, created.id);
        }
      }
    }
  }
}
