import type { Request } from "express";
import type { AppContext } from "../context";
import type { User } from "@shared/schema";

export interface GenerateScreeningPdfInput {
  clinician: User;
  screeningId: string;
}

export interface GenerateScreeningPdfResult {
  pdfBuffer: Buffer;
  filename: string;
}

export async function generateScreeningPdf(
  ctx: AppContext,
  req: Request,
  input: GenerateScreeningPdfInput
): Promise<GenerateScreeningPdfResult | null> {
  const screening = await ctx.storage.getInternalScreeningById(input.screeningId);
  if (!screening || screening.clinicianUserId !== input.clinician.id) {
    return null;
  }
  
  await ctx.audit.logClinicianAction(req, input.clinician, 'pdf_generated', {
    details: { screeningId: input.screeningId },
  });
  
  const filename = `screening-${input.screeningId}.pdf`;
  const pdfBuffer = Buffer.from('PDF placeholder');
  
  return { pdfBuffer, filename };
}
