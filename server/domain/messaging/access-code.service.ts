import { pbkdf2Sync, randomBytes } from "crypto";

export interface AccessCodeResult {
  accessCode: string;
  accessCodeHash: string;
  accessCodeSalt: string;
}

export function generateAccessCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function hashAccessCode(code: string, salt: string): string {
  return pbkdf2Sync(code, salt, 100000, 64, 'sha512').toString('hex');
}

export function createSecureAccessCode(): AccessCodeResult {
  const accessCode = generateAccessCode();
  const accessCodeSalt = randomBytes(16).toString('hex');
  const accessCodeHash = hashAccessCode(accessCode, accessCodeSalt);
  
  return {
    accessCode,
    accessCodeHash,
    accessCodeSalt,
  };
}

export function verifyAccessCode(
  inputCode: string, 
  storedHash: string, 
  salt: string
): boolean {
  const inputHash = hashAccessCode(inputCode, salt);
  return inputHash === storedHash;
}
