import { Router } from "express";
import { requireAuth, requireSubscription } from "../auth";
import { storage } from "../storage";
import { insertContentItemSchema } from "@shared/schema";
import { getAllContentFromContentful, getContentByIdFromContentful, isContentfulConfigured, ContentfulError } from "../contentful";
import { logClinicianAction } from "../audit";

const router = Router();

// Get all content (with Contentful fallback)
router.get("/", requireSubscription, async (req, res, next) => {
  try {
    if (isContentfulConfigured()) {
      try {
        const content = await getAllContentFromContentful();
        res.json(content);
        return;
      } catch (error) {
        if (error instanceof ContentfulError) {
          console.warn("Contentful fetch failed, falling back to database:", error.message);
        }
      }
    }
    const content = await storage.getAllContent();
    res.json(content);
  } catch (error) {
    next(error);
  }
});

// Get single content item
router.get("/:id", requireSubscription, async (req, res, next) => {
  try {
    let content = null;
    if (isContentfulConfigured()) {
      try {
        content = await getContentByIdFromContentful(req.params.id);
      } catch (error) {
        if (error instanceof ContentfulError) {
          console.warn("Contentful fetch failed, falling back to database:", error.message);
        }
      }
    }
    if (!content) {
      content = await storage.getContentById(req.params.id);
    }
    if (!content) {
      return res.status(404).send("Content not found");
    }
    
    await logClinicianAction(req, req.user!, 'content_access', {
      resourceType: 'content',
      resourceId: req.params.id,
      details: { title: content.title },
    });
    
    res.json(content);
  } catch (error) {
    next(error);
  }
});

// Get content status
router.get("/status", requireAuth, async (req, res, next) => {
  try {
    const isConfigured = isContentfulConfigured();
    res.json({ 
      source: isConfigured ? 'contentful' : 'database',
      isContentfulConfigured: isConfigured
    });
  } catch (error) {
    next(error);
  }
});

// Get frequently used content
router.get("/frequently-used", requireAuth, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    const content = await storage.getFrequentlyUsedContent(req.user!.id, limit);
    res.json(content);
  } catch (error) {
    next(error);
  }
});

// Create content
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const data = insertContentItemSchema.parse(req.body);
    const content = await storage.createContent(data);
    
    await logClinicianAction(req, req.user!, 'content_create', {
      resourceType: 'content',
      resourceId: content.id,
      details: { title: content.title },
    });
    
    res.status(201).json(content);
  } catch (error) {
    next(error);
  }
});

// Update content
router.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const content = await storage.updateContent(req.params.id, req.body);
    
    if (!content) {
      return res.status(404).send("Content not found");
    }
    
    await logClinicianAction(req, req.user!, 'content_update', {
      resourceType: 'content',
      resourceId: req.params.id,
      details: { title: content.title },
    });
    
    res.json(content);
  } catch (error) {
    next(error);
  }
});

// Delete content
router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    await logClinicianAction(req, req.user!, 'content_delete', {
      resourceType: 'content',
      resourceId: req.params.id,
    });
    
    await storage.deleteContent(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export { router as contentRouter };
