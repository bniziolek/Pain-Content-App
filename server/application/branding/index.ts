/**
 * Architecture: Application layer. Orchestrates domain logic and infrastructure.
 * Branding service for managing clinic branding settings (Pro/Enterprise feature).
 */

import type { User, ClinicBranding, InsertClinicBranding } from "@shared/schema";
import type { AppContext, AuditRequestContext } from "../context";
import type { IStorage } from "../../storage";

interface MinimalContext {
  storage: IStorage;
}

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
  ctx: MinimalContext,
  params: GetBrandingParams
): Promise<ClinicBranding | null> {
  const branding = await ctx.storage.getClinicBranding(params.clinician.id);
  return branding || null;
}

export async function saveClinicBranding(
  ctx: MinimalContext,
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
      ...params.branding,
      userId: params.clinician.id,
    } as InsertClinicBranding);
  }
}

export async function deleteClinicBranding(
  ctx: MinimalContext,
  params: DeleteBrandingParams
): Promise<void> {
  await ctx.storage.deleteClinicBranding(params.clinician.id);
}

export async function saveClinicBrandingWithAudit(
  ctx: AppContext,
  auditContext: AuditRequestContext,
  params: SaveBrandingParams
): Promise<ClinicBranding> {
  const result = await saveClinicBranding(ctx, params);
  
  await ctx.audit.logClinicianAction(auditContext, params.clinician, "branding_update", {
    resourceType: "clinic_branding",
    phiAccessed: false,
    details: {
      hasLogo: !!params.branding.logoUrl,
      hasCustomColors: !!(params.branding.primaryColor || params.branding.secondaryColor || params.branding.accentColor),
    },
  });
  
  return result;
}

export async function deleteClinicBrandingWithAudit(
  ctx: AppContext,
  auditContext: AuditRequestContext,
  params: DeleteBrandingParams
): Promise<void> {
  await deleteClinicBranding(ctx, params);
  
  await ctx.audit.logClinicianAction(auditContext, params.clinician, "branding_delete", {
    resourceType: "clinic_branding",
    phiAccessed: false,
    details: {},
  });
}
