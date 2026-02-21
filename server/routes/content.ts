/**
 * Architecture: Routes layer (HTTP adapter). Validates requests, calls application services, returns responses.
 */

import { Router } from "express";
import { requireAuth, requireSubscription } from "../auth";
import { insertContentItemSchema } from "@shared/schema";
import {
  createAppContextWithInfrastructure,
  createContent,
  deleteContent,
  getContent,
  getContentStatus,
  getFrequentlyUsedContent,
  listContent,
  updateContent,
} from "../application";
import { buildAuditRequestContext } from "../http/audit-context";

const router = Router();
const appContext = createAppContextWithInfrastructure();

// Get all content (with Contentful fallback)
router.get("/", requireSubscription, async (req, res, next) => {
  try {
    const content = await listContent(appContext, { clinician: req.user! });
    res.json(content);
  } catch (error) {
    next(error);
  }
});

// Get single content item
router.get("/:id", requireSubscription, async (req, res, next) => {
  try {
    const content = await getContent(appContext, {
      auditContext: buildAuditRequestContext(req),
      clinician: req.user!,
      contentId: req.params.id,
    });
    if (!content) {
      return res.status(404).send("Content not found");
    }
    res.json(content);
  } catch (error) {
    next(error);
  }
});

// Get content status
router.get("/status", requireAuth, async (req, res, next) => {
  try {
    const status = await getContentStatus(appContext, { clinician: req.user! });
    res.json(status);
  } catch (error) {
    next(error);
  }
});

// Get frequently used content
router.get("/frequently-used", requireAuth, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    const content = await getFrequentlyUsedContent(appContext, {
      clinician: req.user!,
      limit,
    });
    res.json(content);
  } catch (error) {
    next(error);
  }
});

// Create content
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const isModerator = req.user!.role === 'admin' || req.user!.role === 'super_admin';
    const data = insertContentItemSchema.parse({
      ...req.body,
      clinicianUserId: req.user!.id,
      moderationStatus: isModerator ? 'approved' : 'pending',
      submittedAt: new Date(),
    });
    const content = await createContent(appContext, {
      auditContext: buildAuditRequestContext(req),
      clinician: req.user!,
      data,
    });
    res.status(201).json(content);
  } catch (error) {
    next(error);
  }
});

// Update content
router.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const content = await updateContent(appContext, {
      auditContext: buildAuditRequestContext(req),
      clinician: req.user!,
      contentId: req.params.id,
      updates: req.body,
    });
    
    if (!content) {
      return res.status(404).send("Content not found");
    }
    res.json(content);
  } catch (error) {
    next(error);
  }
});

// Delete content
router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    await deleteContent(appContext, {
      auditContext: buildAuditRequestContext(req),
      clinician: req.user!,
      contentId: req.params.id,
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export { router as contentRouter };
