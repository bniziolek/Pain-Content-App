/**
 * Architecture: Routes layer (HTTP adapter). Validates requests, calls application services, returns responses.
 */

import type { Express } from "express";
import {
  createAppContextWithInfrastructure,
  getPublicContentByToken,
  trackContentTimeByToken,
} from "../application";

export function registerPublicContentRoutes(app: Express) {
  const appContext = createAppContextWithInfrastructure();

  app.get("/api/public/content-view/:token", async (req, res, next) => {
    try {
      const result = await getPublicContentByToken(appContext, { token: req.params.token });
      if (!result.content) {
        return res.status(404).json({ error: "Content not found" });
      }

      res.json({
        ...result.content,
        viewToken: result.viewToken,
      });
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/public/content-view/:token/time", async (req, res, next) => {
    try {
      const { timeSpentSeconds } = req.body;
      const updated = await trackContentTimeByToken(appContext, {
        token: req.params.token,
        timeSpentSeconds,
      });
      if (!updated) {
        return res.status(404).json({ error: "View not found" });
      }

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });
}
