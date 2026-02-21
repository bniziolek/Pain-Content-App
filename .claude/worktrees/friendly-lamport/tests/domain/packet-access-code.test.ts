import { describe, it, expect } from "vitest";
import {
    generatePacketAccessCode,
    normalizeCode,
    isValidCodeFormat,
    isCodeExpired,
    validatePacketCode
} from "../../server/domain/messaging/packet-access-code.service";

describe("Packet Access Code Domain Service", () => {
    describe("generatePacketAccessCode", () => {
        it("should generate a code in the correct format (PREFIX-XXXX)", () => {
            const code = generatePacketAccessCode();
            expect(code).toMatch(/^[A-Z]{4}-[A-Z0-9]{4}$/);
        });

        it("should generate different codes on subsequent calls", () => {
            const code1 = generatePacketAccessCode();
            const code2 = generatePacketAccessCode();
            expect(code1).not.toBe(code2);
        });

        it("should only use allowed characters in the suffix", () => {
            const ALLOWED_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
            for (let i = 0; i < 100; i++) {
                const code = generatePacketAccessCode();
                const suffix = code.split('-')[1];
                for (const char of suffix) {
                    expect(ALLOWED_CHARS).toContain(char);
                }
            }
        });
    });

    describe("normalizeCode", () => {
        it("should uppercase and trim the code", () => {
            expect(normalizeCode(" heal-7x4k ")).toBe("HEAL-7X4K");
        });
    });

    describe("isValidCodeFormat", () => {
        it("should return true for valid codes", () => {
            expect(isValidCodeFormat("HEAL-7X4K")).toBe(true);
            expect(isValidCodeFormat("PAIN-2M9J")).toBe(true);
        });

        it("should return false for invalid codes", () => {
            expect(isValidCodeFormat("HEAL7X4K")).toBe(false);
            expect(isValidCodeFormat("HEA-7X4K")).toBe(false);
            expect(isValidCodeFormat("HEAL-7X4")).toBe(false);
            expect(isValidCodeFormat("HEAL-7X4K1")).toBe(false);
        });
    });

    describe("isCodeExpired", () => {
        it("should return true if the date is in the past", () => {
            const past = new Date();
            past.setDate(past.getDate() - 1);
            expect(isCodeExpired(past)).toBe(true);
        });

        it("should return false if the date is in the future", () => {
            const future = new Date();
            future.setDate(future.getDate() + 1);
            expect(isCodeExpired(future)).toBe(false);
        });
    });

    describe("validatePacketCode", () => {
        it("should return valid: false if code is missing", () => {
            expect(validatePacketCode(null)).toEqual({ valid: false, reason: 'not_found' });
        });

        it("should return valid: false if code is inactive", () => {
            const code = { expiresAt: new Date(Date.now() + 10000), isActive: false };
            expect(validatePacketCode(code)).toEqual({ valid: false, reason: 'inactive' });
        });

        it("should return valid: false if code is expired", () => {
            const past = new Date();
            past.setDate(past.getDate() - 1);
            const code = { expiresAt: past, isActive: true };
            expect(validatePacketCode(code)).toEqual({ valid: false, reason: 'expired' });
        });

        it("should return valid: true for active, non-expired codes", () => {
            const future = new Date();
            future.setDate(future.getDate() + 1);
            const code = { expiresAt: future, isActive: true };
            expect(validatePacketCode(code)).toEqual({ valid: true });
        });
    });
});
