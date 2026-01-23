/**
 * Architecture: Application layer. Orchestrates domain logic and infrastructure.
 * Branding service for managing clinic branding settings (Pro/Enterprise feature).
 */

import type { User, ClinicBranding, InsertClinicBranding } from "@shared/schema";
import type { MinimalAppContext } from "../context-helpers";

export interface GetBrandingParams {
  clinician: User;
}

export interface SaveBrandingParams {
  clinician: User;
  branding: Partial<InsertClinicBranding>;
}

export interface DeleteBrandingParams {
  clinician: User;
}

export async function getClinicBranding(
  ctx: MinimalAppContext,
  params: GetBrandingParams
): Promise<ClinicBranding | null> {
  const branding = await ctx.storage.getClinicBranding(params.clinician.id);
  return branding || null;
}

export async function saveClinicBranding(
  ctx: MinimalAppContext,
  params: SaveBrandingParams
): Promise<ClinicBranding> {
  const existing = await ctx.storage.getClinicBranding(params.clinician.id);

  if (existing) {
    const updated = await ctx.storage.updateClinicBranding(
      params.clinician.id,
      params.branding
    );
    if (!updated) {
      throw new Error("Failed to update branding settings");
    }
    return updated;
  } else {
    return await ctx.storage.createClinicBranding({
      userId: params.clinician.id,
      ...params.branding,
    } as InsertClinicBranding);
  }
}

export async function deleteClinicBranding(
  ctx: MinimalAppContext,
  params: DeleteBrandingParams
): Promise<void> {
  await ctx.storage.deleteClinicBranding(params.clinician.id);
}
