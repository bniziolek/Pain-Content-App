/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext, AuditRequestContext } from "../context";
import type { User } from "@shared/schema";
import { generatePDF, generateFilename, type PDFGenerationConfig } from "../../infrastructure/pdf";

export interface GenerateScreeningPdfInput {
  clinician: User;
  screeningId: string;
  configOverrides?: Partial<PDFGenerationConfig>;
}

export interface GenerateScreeningPdfResult {
  pdfBuffer: Buffer;
  filename: string;
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

  const config: PDFGenerationConfig = {
    pageSize: input.configOverrides?.pageSize ?? "letter",
    orientation: "portrait",
    margins: { top: "0.75in", right: "0.75in", bottom: "0.75in", left: "0.75in" },
    includeTableOfContents: input.configOverrides?.includeTableOfContents ?? false,
    coverPageMessage: input.configOverrides?.coverPageMessage,
    clinicianName: input.configOverrides?.clinicianName || input.clinician.name || "Your Healthcare Provider",
    patientName: input.configOverrides?.patientName || screening.patientName,
    packetTitle: input.configOverrides?.packetTitle,
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
    },
  });
  
  return { pdfBuffer, filename };
}
