/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext, AuditRequestContext } from "../context";
import type { User } from "@shared/schema";
import { generatePDF, generateFilename, type PDFGenerationConfig, type PDFBrandingConfig } from "../../infrastructure/pdf";

export interface GenerateContentPdfInput {
  clinician: User;
  contentIds: string[];
  configOverrides?: Partial<PDFGenerationConfig>;
  patientName?: string;
}

export interface GenerateContentPdfResult {
  pdfBuffer: Buffer;
  filename: string;
}

export async function generateContentPdf(
  ctx: AppContext,
  auditContext: AuditRequestContext,
  input: GenerateContentPdfInput
): Promise<GenerateContentPdfResult | null> {
  const contentItems = (await Promise.all(
    input.contentIds.map((id: string) => ctx.storage.getContentById(id))
  )).filter(Boolean) as any[];

  if (contentItems.length === 0) {
    return null;
  }

  const clinicianTier = input.clinician.subscriptionTier || 'basic';
  const hasBrandingAccess = clinicianTier === 'pro' || clinicianTier === 'enterprise';
  let branding: PDFBrandingConfig | undefined;
  
  if (hasBrandingAccess) {
    const clinicBranding = await ctx.storage.getClinicBranding(input.clinician.id);
    if (clinicBranding && clinicBranding.isActive) {
      branding = {
        logoUrl: clinicBranding.logoUrl,
        clinicName: clinicBranding.clinicName || input.clinician.clinicName,
        tagline: clinicBranding.tagline,
        primaryColor: clinicBranding.primaryColor,
        secondaryColor: clinicBranding.secondaryColor,
        accentColor: clinicBranding.accentColor,
        footerText: clinicBranding.footerText,
        showPoweredBy: clinicBranding.showPoweredBy !== false,
        showWatermark: clinicBranding.showWatermark !== false,
      };
    }
  }

  const config: PDFGenerationConfig = {
    pageSize: input.configOverrides?.pageSize ?? "letter",
    orientation: "portrait",
    margins: { top: "0.75in", right: "0.75in", bottom: "0.75in", left: "0.75in" },
    includeTableOfContents: input.configOverrides?.includeTableOfContents ?? false,
    coverPageMessage: input.configOverrides?.coverPageMessage,
    clinicianName: input.configOverrides?.clinicianName || input.clinician.name || "Your Healthcare Provider",
    patientName: input.patientName,
    packetTitle: input.configOverrides?.packetTitle,
    sectionFormatting: input.configOverrides?.sectionFormatting,
    branding,
  };

  const pdfBuffer = await generatePDF(contentItems, config);
  const filename = generateFilename(input.patientName || "Patient");

  await ctx.audit.logClinicianAction(auditContext, input.clinician, "pdf_generate", {
    resourceType: "content",
    phiAccessed: !!input.patientName,
    phiScope: input.patientName ? "patient name, educational content" : "educational content only",
    details: {
      patientName: input.patientName,
      contentCount: contentItems.length,
      pageSize: config.pageSize,
      customBranding: !!branding,
    },
  });

  return { pdfBuffer, filename };
}
