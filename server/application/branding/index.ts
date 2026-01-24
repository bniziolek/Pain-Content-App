/**
 * Architecture: Application layer. Orchestrates domain logic and infrastructure.
 * Branding service for managing clinic branding settings (Pro/Enterprise feature).
 */

import type { User, ClinicBranding, InsertClinicBranding, BrandingRequest } from "@shared/schema";
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
  branding: BrandingRequest;
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
    // Explicitly construct the branding object to prevent any field override
    const brandingToCreate: InsertClinicBranding = {
      userId: params.clinician.id,
      logoUrl: params.branding.logoUrl ?? null,
      clinicName: params.branding.clinicName ?? null,
      tagline: params.branding.tagline ?? null,
      primaryColor: params.branding.primaryColor ?? null,
      secondaryColor: params.branding.secondaryColor ?? null,
      accentColor: params.branding.accentColor ?? null,
      footerText: params.branding.footerText ?? null,
      showPoweredBy: params.branding.showPoweredBy ?? null,
      showWatermark: params.branding.showWatermark ?? null,
      isActive: true,
    };
    return await ctx.storage.createClinicBranding(brandingToCreate);
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
