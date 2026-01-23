/**
 * Architecture: Routes layer (HTTP adapter). Validates requests, calls application services, returns responses.
 */

import { Router } from "express";
import { requireAuth } from "../auth";
import {
  addFavorite,
  createMinimalContext,
  isFavorite,
  listFavorites,
  removeFavorite,
} from "../application";

const router = Router();
const appContext = createMinimalContext();

// Get all favorites for user
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const favorites = await listFavorites(appContext, { clinician: req.user! });
    res.json(favorites);
  } catch (error) {
    next(error);
  }
});

// Add content to favorites
router.post("/:contentId", requireAuth, async (req, res, next) => {
  try {
    await addFavorite(appContext, {
      clinician: req.user!,
      contentId: req.params.contentId,
    });
    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Remove content from favorites
router.delete("/:contentId", requireAuth, async (req, res, next) => {
  try {
    await removeFavorite(appContext, {
      clinician: req.user!,
      contentId: req.params.contentId,
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Check if content is favorited
router.get("/check/:contentId", requireAuth, async (req, res, next) => {
  try {
    const result = await isFavorite(appContext, {
      clinician: req.user!,
      contentId: req.params.contentId,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export { router as favoritesRouter };
