/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext, AuditRequestContext } from "../context";
import type { User, FeatureFlag } from "@shared/schema";

export interface UpdateFeatureFlagAdminInput {
  admin: User;
  key: string;
  updates: {
    isEnabled?: boolean;
    value?: string | null;
    payload?: unknown;
    name?: string;
    description?: string;
    category?: string;
  };
}

export async function updateFeatureFlagAdmin(
  ctx: AppContext,
  auditContext: AuditRequestContext,
  input: UpdateFeatureFlagAdminInput
): Promise<FeatureFlag | null> {
  const currentFlag = await ctx.storage.getFeatureFlagByKey(input.key);
  if (!currentFlag) {
    return null;
  }

  const cleanedUpdates = {
    ...input.updates,
    value: input.updates.value === null ? undefined : input.updates.value,
  };

  const updated = await ctx.storage.updateFeatureFlag(input.key, cleanedUpdates);
  if (!updated) {
    return null;
  }

  await ctx.audit.logClinicianAction(auditContext, input.admin, "settings_change", {
    resourceType: "feature_flag",
    resourceId: input.key,
    details: {
      action: "updated_feature_flag",
      flagKey: input.key,
      previousValue: currentFlag.value,
      newValue: cleanedUpdates.value !== undefined ? cleanedUpdates.value : currentFlag.value,
      previousEnabled: currentFlag.isEnabled,
      isEnabled: cleanedUpdates.isEnabled !== undefined ? cleanedUpdates.isEnabled : currentFlag.isEnabled,
      changedFields: Object.keys(cleanedUpdates),
    },
  });

  return updated;
}
