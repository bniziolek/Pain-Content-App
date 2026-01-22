import type { Express } from "express";
import { storage } from "../storage";
import { getContentByIdFromContentful, isContentfulConfigured } from "../contentful";

export function registerPublicContentRoutes(app: Express) {
  app.get("/api/public/content-view/:token", async (req, res, next) => {
    try {
      const view = await storage.getContentViewByToken(req.params.token);
      if (!view) {
        return res.status(404).json({ error: "Content not found" });
      }
      
      // Mark as viewed if first time and update email log status to clicked
      if (!view.viewedAt) {
        await storage.updateContentView(view.id, { viewedAt: new Date() });
        await storage.updateEmailLogStatus(view.emailLogId, "clicked");
      }
      
      // Fetch the content
      let content = null;
      if (isContentfulConfigured()) {
        try {
          content = await getContentByIdFromContentful(view.contentId);
        } catch (e) {
          console.warn("Contentful fetch failed:", e);
        }
      }
      if (!content) {
        content = await storage.getContentById(view.contentId);
      }
      
      if (!content) {
        return res.status(404).json({ error: "Content not found" });
      }
      
      res.json({
        ...content,
        viewToken: view.token,
      });
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/public/content-view/:token/time", async (req, res, next) => {
    try {
      const view = await storage.getContentViewByToken(req.params.token);
      if (!view) {
        return res.status(404).json({ error: "View not found" });
      }
      
      const { timeSpentSeconds } = req.body;
      if (typeof timeSpentSeconds === "number" && timeSpentSeconds > 0) {
        await storage.updateContentView(view.id, { timeSpentSeconds });
      }
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });
}
