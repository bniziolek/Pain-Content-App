/**
 * Architecture: Application service layer. Orchestrates access code generation for content packets.
 */

import type { AppContext, AuditRequestContext } from "../context";
import type { User, PacketAccessCode } from "@shared/schema";
import { 
  generatePacketAccessCode, 
  calculateExpirationDate 
} from "../../domain/messaging/packet-access-code.service";

export interface GenerateAccessCodeInput {
  clinician: User;
  screeningId?: string;
  contentIds: string[];
  expirationDays?: number;
}

export interface GenerateAccessCodeResult {
  code: string;
  expiresAt: Date;
  accessCode: PacketAccessCode;
}

export async function generateAccessCode(
  ctx: AppContext,
  auditContext: AuditRequestContext,
  input: GenerateAccessCodeInput
): Promise<GenerateAccessCodeResult> {
  const expiresAt = calculateExpirationDate(input.expirationDays ?? 90);
  
  let code: string;
  let attempts = 0;
  const maxAttempts = 10;
  
  do {
    code = generatePacketAccessCode();
    const existing = await ctx.storage.getPacketAccessCodeByCode(code);
    if (!existing) break;
    attempts++;
  } while (attempts < maxAttempts);
  
  if (attempts >= maxAttempts) {
    throw new Error("Failed to generate unique access code after maximum attempts");
  }

  const accessCode = await ctx.storage.createPacketAccessCode({
    code,
    clinicianId: input.clinician.id,
    internalScreeningId: input.screeningId || null,
    contentIds: input.contentIds,
    expiresAt,
    isActive: true,
  });

  await ctx.audit.logClinicianAction(auditContext, input.clinician, "packet_access_code_generate", {
    resourceType: "packet_access_code",
    resourceId: accessCode.id,
    details: {
      code,
      screeningId: input.screeningId,
      contentCount: input.contentIds.length,
      expiresAt: expiresAt.toISOString(),
    },
  });

  return {
    code,
    expiresAt,
    accessCode,
  };
}
