/**
 * Architecture: Domain layer. Pure business logic for packet access code generation and validation.
 * 
 * Generates short, memorable access codes for content packets that patients can enter
 * to access digital content from printed PDFs.
 */

const AMBIGUOUS_CHARS = ['0', 'O', '1', 'l', 'I'];
const ALLOWED_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

const PREFIXES = ['HEAL', 'PAIN', 'MOVE', 'FLEX', 'CARE', 'WELL', 'FLOW', 'EASE'];

export interface PacketCodeValidationResult {
  valid: boolean;
  reason?: 'not_found' | 'expired' | 'inactive';
}

export function generatePacketAccessCode(): string {
  const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
  let suffix = '';
  
  for (let i = 0; i < 4; i++) {
    suffix += ALLOWED_CHARS[Math.floor(Math.random() * ALLOWED_CHARS.length)];
  }
  
  return `${prefix}-${suffix}`;
}

export function normalizeCode(code: string): string {
  return code.toUpperCase().trim();
}

export function isValidCodeFormat(code: string): boolean {
  const normalized = normalizeCode(code);
  const pattern = /^[A-Z]{4}-[A-Z0-9]{4}$/;
  return pattern.test(normalized);
}

export function calculateExpirationDate(daysFromNow: number = 90): Date {
  const expiration = new Date();
  expiration.setDate(expiration.getDate() + daysFromNow);
  return expiration;
}

export function isCodeExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

export function validatePacketCode(
  code: { expiresAt: Date; isActive: boolean | null } | null | undefined
): PacketCodeValidationResult {
  if (!code) {
    return { valid: false, reason: 'not_found' };
  }
  
  if (!code.isActive) {
    return { valid: false, reason: 'inactive' };
  }
  
  if (isCodeExpired(code.expiresAt)) {
    return { valid: false, reason: 'expired' };
  }
  
  return { valid: true };
}
