/**
 * Architecture: Routes layer (HTTP adapter). Validates requests, calls application services, returns responses.
 */

import { Router } from "express";
import { requireAdmin } from "../auth";
import {
  createAppContext,
  createDataInventoryItem,
  deleteDataInventoryItem,
  getContentUsageAnalytics,
  getDataInventory,
  getSubscriptionMetrics,
  getUserActivityAnalytics,
  listAuditLogs,
  updateDataInventoryItem,
} from "../application";

const router = Router();
const appContext = createAppContext();

// ====== Audit Logs Routes ======

router.get("/audit-logs", requireAdmin, async (req, res, next) => {
  try {
    const { action, resourceType, userId, limit = 100 } = req.query;
    const logs = await listAuditLogs(appContext, {
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
    const inventory = await getDataInventory(appContext);
    res.json(inventory);
  } catch (error) {
    next(error);
  }
});

router.post("/data-inventory", requireAdmin, async (req, res, next) => {
  try {
    const item = await createDataInventoryItem(appContext, req.body);
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

router.patch("/data-inventory/:id", requireAdmin, async (req, res, next) => {
  try {
    const item = await updateDataInventoryItem(appContext, req.params.id, req.body);
    res.json(item);
  } catch (error) {
    next(error);
  }
});

router.delete("/data-inventory/:id", requireAdmin, async (req, res, next) => {
  try {
    await deleteDataInventoryItem(appContext, req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// ====== Admin Analytics Routes ======

router.get("/analytics/user-activity", requireAdmin, async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const activity = await getUserActivityAnalytics(appContext, parseInt(days as string));
    res.json(activity);
  } catch (error) {
    next(error);
  }
});

router.get("/analytics/content-usage", requireAdmin, async (req, res, next) => {
  try {
    const usage = await getContentUsageAnalytics(appContext);
    res.json(usage);
  } catch (error) {
    next(error);
  }
});

router.get("/analytics/subscription-metrics", requireAdmin, async (req, res, next) => {
  try {
    const metrics = await getSubscriptionMetrics(appContext);
    res.json(metrics);
  } catch (error) {
    next(error);
  }
});

export { router as complianceRouter };
