/**
 * Architecture: Application service layer. Handles public (unauthenticated) access code lookup.
 */

import type { AppContext, AuditRequestContext } from "../context";
import type { ContentItem } from "@shared/schema";
import { 
  normalizeCode, 
  validatePacketCode,
  type PacketCodeValidationResult 
} from "../../domain/messaging/packet-access-code.service";

export interface PublicLookupInput {
  code: string;
}

export interface PublicLookupContentItem {
  id: string;
  title: string;
  type: 'article' | 'video' | 'interactive';
  summary: string;
  imageUrl: string | null;
  readTime: string | null;
  tags: string[];
}

export interface PublicLookupResult {
  valid: boolean;
  reason?: 'not_found' | 'expired' | 'inactive';
  content?: PublicLookupContentItem[];
  clinicianName?: string;
  expiresAt?: string;
}

function mapContentToPublic(content: ContentItem): PublicLookupContentItem {
  const hasVideoTag = content.tags?.some(tag => 
    tag.toLowerCase().includes('video')
  );
  const hasInteractiveTag = content.tags?.some(tag => 
    tag.toLowerCase().includes('interactive') || tag.toLowerCase().includes('exercise')
  );
  
  return {
    id: content.id,
    title: content.title,
    type: hasVideoTag ? 'video' : hasInteractiveTag ? 'interactive' : 'article',
    summary: content.summary,
    imageUrl: content.imageUrl,
    readTime: content.readTime,
    tags: content.tags || [],
  };
}

export async function publicLookup(
  ctx: AppContext,
  auditContext: AuditRequestContext,
  input: PublicLookupInput
): Promise<PublicLookupResult> {
  const normalizedCode = normalizeCode(input.code);
  
  const accessCode = await ctx.storage.getPacketAccessCodeByCode(normalizedCode);
  
  const validation = validatePacketCode(accessCode);
  
  if (!validation.valid) {
    await ctx.audit.logAuditEvent(auditContext, {
      actorType: "patient",
      action: "packet_access_code_lookup_failed",
      details: {
        code: normalizedCode,
        reason: validation.reason,
      },
      outcome: "failure",
    });
    
    return {
      valid: false,
      reason: validation.reason,
    };
  }

  await ctx.storage.incrementPacketAccessCount(normalizedCode);

  const contentIds = accessCode!.contentIds || [];
  const contentItems = await Promise.all(
    contentIds.map((id: string) => ctx.storage.getContentById(id))
  );
  const validContent = contentItems.filter(Boolean) as ContentItem[];

  const clinician = await ctx.storage.getUser(accessCode!.clinicianId);

  await ctx.audit.logAuditEvent(auditContext, {
    actorType: "patient",
    action: "packet_access_code_lookup_success",
    resourceType: "packet_access_code",
    resourceId: accessCode!.id,
    details: {
      code: normalizedCode,
      contentCount: validContent.length,
    },
    outcome: "success",
  });

  return {
    valid: true,
    content: validContent.map(mapContentToPublic),
    clinicianName: clinician?.name || clinician?.clinicName || "Your Healthcare Provider",
    expiresAt: accessCode!.expiresAt.toISOString(),
  };
}
