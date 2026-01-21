import { Router } from "express";
import { requireAdmin } from "../auth";
import { storage } from "../storage";

const router = Router();

// ====== Audit Logs Routes ======

router.get("/audit-logs", requireAdmin, async (req, res, next) => {
  try {
    const { action, resourceType, userId, limit = 100 } = req.query;
    const logs = await storage.getAuditLogs({
      action: action as string,
      resourceType: resourceType as string,
      userId: userId as string,
      limit: parseInt(limit as string),
    });
    res.json(logs);
  } catch (error) {
    next(error);
  }
});

// ====== Data Inventory Routes (HIPAA Compliance) ======

router.get("/data-inventory", requireAdmin, async (req, res, next) => {
  try {
    const inventory = await storage.getDataInventory();
    res.json(inventory);
  } catch (error) {
    next(error);
  }
});

router.post("/data-inventory", requireAdmin, async (req, res, next) => {
  try {
    const item = await storage.createDataInventoryItem(req.body);
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

router.patch("/data-inventory/:id", requireAdmin, async (req, res, next) => {
  try {
    const item = await storage.updateDataInventoryItem(req.params.id, req.body);
    res.json(item);
  } catch (error) {
    next(error);
  }
});

router.delete("/data-inventory/:id", requireAdmin, async (req, res, next) => {
  try {
    await storage.deleteDataInventoryItem(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// ====== Admin Analytics Routes ======

router.get("/analytics/user-activity", requireAdmin, async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const activity = await storage.getUserActivityAnalytics(parseInt(days as string));
    res.json(activity);
  } catch (error) {
    next(error);
  }
});

router.get("/analytics/content-usage", requireAdmin, async (req, res, next) => {
  try {
    const usage = await storage.getContentUsageAnalytics();
    res.json(usage);
  } catch (error) {
    next(error);
  }
});

router.get("/analytics/subscription-metrics", requireAdmin, async (req, res, next) => {
  try {
    const metrics = await storage.getSubscriptionMetrics();
    res.json(metrics);
  } catch (error) {
    next(error);
  }
});

export { router as complianceRouter };
