/**
 * Architecture: Routes layer (HTTP adapter). Validates requests, calls application services, returns responses.
 */

import { Router } from "express";
import { requireAuth } from "../auth";
import {
  addToCollection,
  createCollection,
  createMinimalContext,
  deleteCollection,
  getCollectionWithItems,
  listCollections,
  removeFromCollection,
  updateCollection,
} from "../application";

const router = Router();
const appContext = createMinimalContext();

// Get all collections for user
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const collections = await listCollections(appContext, { clinician: req.user! });
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
    const collection = await createCollection(appContext, {
      clinician: req.user!,
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
    const collection = await getCollectionWithItems(appContext, {
      clinician: req.user!,
      collectionId: req.params.id,
    });
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
    const collection = await updateCollection(appContext, {
      clinician: req.user!,
      collectionId: req.params.id,
      name,
      description,
    });
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
    const deleted = await deleteCollection(appContext, {
      clinician: req.user!,
      collectionId: req.params.id,
    });
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
    const item = await addToCollection(appContext, {
      clinician: req.user!,
      collectionId: req.params.id,
      contentId,
    });
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
    const removed = await removeFromCollection(appContext, {
      clinician: req.user!,
      collectionId: req.params.id,
      contentId: req.params.contentId,
    });
    if (!removed) {
      return res.status(404).json({ error: "Item not found in collection" });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export { router as collectionsRouter };
