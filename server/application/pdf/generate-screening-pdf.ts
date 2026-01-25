/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext, AuditRequestContext } from "../context";
import type { User } from "@shared/schema";
import { generatePDF, generateFilename, generateQRCodeDataUrl, buildLookupUrl, type PDFGenerationConfig } from "../../infrastructure/pdf";
import { generatePacketAccessCode, calculateExpirationDate } from "../../domain/messaging/packet-access-code.service";

export interface GenerateScreeningPdfInput {
  clinician: User;
  screeningId: string;
  configOverrides?: Partial<PDFGenerationConfig>;
  includeAccessCode?: boolean;
  accessCodeExpirationDays?: number;
}

export interface GenerateScreeningPdfResult {
  pdfBuffer: Buffer;
  filename: string;
  accessCode?: string;
  accessCodeExpiresAt?: Date;
}

export async function generateScreeningPdf(
  ctx: AppContext,
  auditContext: AuditRequestContext,
  input: GenerateScreeningPdfInput
): Promise<GenerateScreeningPdfResult | null> {
  const screening = await ctx.storage.getInternalScreeningById(input.screeningId);
  if (!screening || screening.clinicianUserId !== input.clinician.id) {
    return null;
  }

  const contentIds = screening.recommendedContentIds || [];
  const contentItems = (await Promise.all(
    contentIds.map((id: string) => ctx.storage.getContentById(id))
  )).filter(Boolean) as any[];

  if (contentItems.length === 0) {
    return null;
  }

  let accessCode: string | undefined;
  let accessCodeExpiresAt: Date | undefined;
  let qrCodeDataUrl: string | undefined;
  let lookupUrl: string | undefined;

  if (input.includeAccessCode) {
    const expirationDays = input.accessCodeExpirationDays ?? 90;
    accessCodeExpiresAt = calculateExpirationDate(expirationDays);
    
    let generatedCode: string;
    let attempts = 0;
    const maxAttempts = 10;
    
    do {
      generatedCode = generatePacketAccessCode();
      const existing = await ctx.storage.getPacketAccessCodeByCode(generatedCode);
      if (!existing) break;
      attempts++;
    } while (attempts < maxAttempts);
    
    if (attempts >= maxAttempts) {
      throw new Error("Failed to generate unique access code");
    }
    
    accessCode = generatedCode!;
    
    await ctx.storage.createPacketAccessCode({
      code: accessCode,
      clinicianId: input.clinician.id,
      internalScreeningId: input.screeningId,
      contentIds: contentIds as string[],
      expiresAt: accessCodeExpiresAt,
      isActive: true,
    });

    const qrUrl = buildLookupUrl(accessCode);
    qrCodeDataUrl = await generateQRCodeDataUrl(qrUrl);
    
    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : process.env.REPLIT_DOMAINS 
        ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
        : 'https://driverpath.com';
    lookupUrl = `${baseUrl}/lookup`;
  }

  const config: PDFGenerationConfig = {
    pageSize: input.configOverrides?.pageSize ?? "letter",
    orientation: "portrait",
    margins: { top: "0.75in", right: "0.75in", bottom: "0.75in", left: "0.75in" },
    includeTableOfContents: input.configOverrides?.includeTableOfContents ?? false,
    coverPageMessage: input.configOverrides?.coverPageMessage,
    clinicianName: input.configOverrides?.clinicianName || input.clinician.name || "Your Healthcare Provider",
    patientName: input.configOverrides?.patientName || screening.patientName,
    packetTitle: input.configOverrides?.packetTitle,
    sectionFormatting: input.configOverrides?.sectionFormatting,
    accessCode,
    qrCodeDataUrl,
    lookupUrl,
  };

  const pdfBuffer = await generatePDF(contentItems, config);
  const filename = generateFilename(screening.patientName);

  await ctx.audit.logClinicianAction(auditContext, input.clinician, "pdf_generate", {
    resourceType: "screening",
    resourceId: input.screeningId,
    phiAccessed: true,
    phiScope: "patient name, educational content",
    details: {
      patientName: screening.patientName,
      contentCount: contentItems.length,
      pageSize: config.pageSize,
      includeAccessCode: !!input.includeAccessCode,
      accessCode,
    },
  });
  
  return { pdfBuffer, filename, accessCode, accessCodeExpiresAt };
}
