import { Router } from "express";
import { requireAuth } from "../auth";
import { storage } from "../storage";

const router = Router();

// Get all favorites for user
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const favorites = await storage.getUserFavorites(req.user!.id);
    res.json(favorites);
  } catch (error) {
    next(error);
  }
});

// Add content to favorites
router.post("/:contentId", requireAuth, async (req, res, next) => {
  try {
    await storage.addFavorite(req.user!.id, req.params.contentId);
    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Remove content from favorites
router.delete("/:contentId", requireAuth, async (req, res, next) => {
  try {
    await storage.removeFavorite(req.user!.id, req.params.contentId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Check if content is favorited
router.get("/check/:contentId", requireAuth, async (req, res, next) => {
  try {
    const isFavorite = await storage.isFavorite(req.user!.id, req.params.contentId);
    res.json({ isFavorite });
  } catch (error) {
    next(error);
  }
});

export { router as favoritesRouter };
