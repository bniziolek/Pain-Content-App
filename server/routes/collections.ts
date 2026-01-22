import { Router } from "express";
import { requireAuth } from "../auth";
import { storage } from "../storage";

const router = Router();

// Get all collections for user
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const collections = await storage.getUserCollections(req.user!.id);
    res.json(collections);
  } catch (error) {
    next(error);
  }
});

// Create collection
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Collection name is required" });
    }
    const collection = await storage.createCollection({
      userId: req.user!.id,
      name,
      description: description || null,
    });
    res.status(201).json(collection);
  } catch (error) {
    next(error);
  }
});

// Get single collection with items
router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const collection = await storage.getCollectionWithItems(req.params.id, req.user!.id);
    if (!collection) {
      return res.status(404).json({ error: "Collection not found" });
    }
    res.json(collection);
  } catch (error) {
    next(error);
  }
});

// Update collection
router.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const collection = await storage.updateCollection(req.params.id, req.user!.id, { name, description });
    if (!collection) {
      return res.status(404).json({ error: "Collection not found" });
    }
    res.json(collection);
  } catch (error) {
    next(error);
  }
});

// Delete collection
router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const deleted = await storage.deleteCollection(req.params.id, req.user!.id);
    if (!deleted) {
      return res.status(404).json({ error: "Collection not found" });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Add item to collection
router.post("/:id/items", requireAuth, async (req, res, next) => {
  try {
    const { contentId } = req.body;
    if (!contentId) {
      return res.status(400).json({ error: "Content ID is required" });
    }
    const item = await storage.addToCollection(req.params.id, contentId, req.user!.id);
    if (!item) {
      return res.status(404).json({ error: "Collection not found" });
    }
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

// Remove item from collection
router.delete("/:id/items/:contentId", requireAuth, async (req, res, next) => {
  try {
    const removed = await storage.removeFromCollection(req.params.id, req.params.contentId, req.user!.id);
    if (!removed) {
      return res.status(404).json({ error: "Item not found in collection" });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export { router as collectionsRouter };
