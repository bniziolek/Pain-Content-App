import { Router } from "express";
import { requireSubscription } from "../auth";
import { storage } from "../storage";
import { generatePDF, generateFilename, type PDFGenerationConfig } from "../pdf-generator";
import { logClinicianAction } from "../audit";

const router = Router();

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

    // Get screening
    const screening = await storage.getInternalScreeningById(screeningId);
    if (!screening) {
      return res.status(404).json({ error: "Screening not found" });
    }

    // Get recommended content
    const contentIds = screening.recommendedContentIds || [];
    if (contentIds.length === 0) {
      return res.status(400).json({ error: "No content to generate PDF from" });
    }

    const contentItems = (await Promise.all(
      contentIds.map((id: string) => storage.getContentById(id))
    )).filter(Boolean) as any[];
    
    if (contentItems.length === 0) {
      return res.status(404).json({ error: "Content not found" });
    }

    const config: PDFGenerationConfig = {
      pageSize: pageSize as 'letter' | 'a4',
      includeTableOfContents,
      coverPageMessage,
      clinicianName: clinicianName || req.user!.name || 'Your Healthcare Provider',
      patientName: screening.patientName,
    };

    const pdfBuffer = await generatePDF(contentItems, config);
    const filename = generateFilename(screening.patientName);

    await logClinicianAction(req, req.user!, 'pdf_generate', {
      resourceType: 'screening',
      resourceId: screeningId,
      phiAccessed: true,
      phiScope: 'patient name, educational content',
      details: { 
        patientName: screening.patientName,
        contentCount: contentItems.length,
        pageSize,
      },
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
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

    const contentItems = (await Promise.all(
      contentIds.map((id: string) => storage.getContentById(id))
    )).filter(Boolean) as any[];
    
    if (contentItems.length === 0) {
      return res.status(404).json({ error: "Content not found" });
    }

    const config: PDFGenerationConfig = {
      pageSize: pageSize as 'letter' | 'a4',
      includeTableOfContents,
      coverPageMessage,
      clinicianName: clinicianName || req.user!.name || 'Your Healthcare Provider',
      patientName,
      packetTitle,
    };

    const pdfBuffer = await generatePDF(contentItems, config);
    const filename = generateFilename(patientName || 'Patient');

    await logClinicianAction(req, req.user!, 'pdf_generate', {
      resourceType: 'content',
      phiAccessed: !!patientName,
      phiScope: patientName ? 'patient name, educational content' : 'educational content only',
      details: { 
        patientName,
        contentCount: contentItems.length,
        pageSize,
      },
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
});

export { router as pdfRouter };
