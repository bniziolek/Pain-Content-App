/**
 * Architecture: Routes layer (HTTP adapter). Validates requests, calls application services, returns responses.
 * 
 * This file contains both authenticated routes for generating access codes
 * and public (unauthenticated) routes for looking up codes.
 */

import { Router, type Express } from "express";
import { z } from "zod";
import { requireSubscription } from "../auth";
import {
  createAppContextWithInfrastructure,
  generateAccessCode,
  publicLookup,
} from "../application";
import { buildAuditRequestContext } from "../http/audit-context";

const router = Router();
const appContext = createAppContextWithInfrastructure();

const generateCodeSchema = z.object({
  contentIds: z.array(z.string()).min(1, "At least one content ID is required"),
  screeningId: z.string().optional(),
  expirationDays: z.number().min(1).max(365).optional(),
});

router.post("/:screeningId/generate-access-code", requireSubscription, async (req, res, next) => {
  try {
    const { screeningId } = req.params;
    const { contentIds, expirationDays } = req.body;

    if (!contentIds || !Array.isArray(contentIds) || contentIds.length === 0) {
      return res.status(400).json({ error: "Content IDs required" });
    }

    const result = await generateAccessCode(
      appContext,
      buildAuditRequestContext(req),
      {
        clinician: req.user!,
        screeningId,
        contentIds,
        expirationDays,
      }
    );

    res.json({
      code: result.code,
      expiresAt: result.expiresAt.toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/generate-access-code", requireSubscription, async (req, res, next) => {
  try {
    const validation = generateCodeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: "Validation failed", 
        details: validation.error.issues 
      });
    }

    const { contentIds, screeningId, expirationDays } = validation.data;

    const result = await generateAccessCode(
      appContext,
      buildAuditRequestContext(req),
      {
        clinician: req.user!,
        screeningId,
        contentIds,
        expirationDays,
      }
    );

    res.json({
      code: result.code,
      expiresAt: result.expiresAt.toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

export { router as packetAccessCodesRouter };

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 10;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  entry.count++;
  return true;
}

export function registerPublicAccessCodeRoutes(app: Express) {
  app.get("/api/public/lookup/:code", async (req, res, next) => {
    try {
      const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
      
      if (!checkRateLimit(clientIp)) {
        return res.status(429).json({ 
          error: "Too many requests. Please try again later." 
        });
      }

      const { code } = req.params;
      
      if (!code || code.length < 4) {
        return res.status(400).json({ error: "Invalid access code format" });
      }

      const result = await publicLookup(
        appContext,
        buildAuditRequestContext(req),
        { code }
      );

      if (!result.valid) {
        const statusCode = result.reason === 'not_found' ? 404 : 410;
        const message = result.reason === 'expired' 
          ? 'This access code has expired'
          : result.reason === 'inactive'
            ? 'This access code is no longer active'
            : 'Access code not found';
        return res.status(statusCode).json({ 
          valid: false,
          error: message,
          reason: result.reason 
        });
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  });
}
