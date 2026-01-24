/**
 * Architecture: Routes layer (HTTP adapter). Validates requests, calls application services, returns responses.
 */

import { Router } from "express";
import { requireSubscription } from "../auth";
import {
  createAppContextWithInfrastructure,
  generateContentPdf,
  generateScreeningPdf,
} from "../application";
import { buildAuditRequestContext } from "../http/audit-context";

const router = Router();
const appContext = createAppContextWithInfrastructure();

// Generate PDF from screening
router.post("/packets/:screeningId/generate-pdf", requireSubscription, async (req, res, next) => {
  try {
    const { screeningId } = req.params;
    const { 
      pageSize = 'letter',
      includeTableOfContents = false,
      coverPageMessage,
      clinicianName
    } = req.body;

    const result = await generateScreeningPdf(appContext, buildAuditRequestContext(req), {
      clinician: req.user!,
      screeningId,
      configOverrides: {
        pageSize,
        includeTableOfContents,
        coverPageMessage,
        clinicianName,
      },
    });
    if (!result) {
      return res.status(404).json({ error: "Screening or content not found" });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.pdfBuffer);
  } catch (error) {
    next(error);
  }
});

// Generate PDF from content IDs directly
  router.post("/content/generate-pdf", requireSubscription, async (req, res, next) => {
  try {
    const { 
      contentIds,
      pageSize = 'letter',
      includeTableOfContents = false,
      coverPageMessage,
      clinicianName,
      patientName,
      packetTitle
    } = req.body;

    if (!contentIds || !Array.isArray(contentIds) || contentIds.length === 0) {
      return res.status(400).json({ error: "Content IDs required" });
    }

    const result = await generateContentPdf(appContext, buildAuditRequestContext(req), {
      clinician: req.user!,
      contentIds,
      patientName,
      configOverrides: {
        pageSize,
        includeTableOfContents,
        coverPageMessage,
        clinicianName,
        packetTitle,
      },
    });
    if (!result) {
      return res.status(404).json({ error: "Content not found" });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.pdfBuffer);
  } catch (error) {
    next(error);
  }
});

export { router as pdfRouter };
