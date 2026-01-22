/**
 * Architecture: Routes layer (HTTP adapter). Validates requests, calls application services, returns responses.
 */

import { Router } from "express";
import { requireAuth, requireAdmin } from "../auth";
import {
  adminUpdateUserSubscription,
  adminUpdateUserTier,
  cancelSubscription,
  changeSubscriptionTier,
  createAppContextWithInfrastructure,
  createCheckoutSessionFlow,
  createPortalSessionFlow,
  getStripeConfig,
  getSubscriptionOverview,
  listEnabledFeatureFlags,
  listInvoices,
  listPlans,
  resumeSubscription,
} from "../application";

const router = Router();
const appContext = createAppContextWithInfrastructure();

// Get subscription status
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const overview = await getSubscriptionOverview(appContext, { user: req.user! });
    res.json(overview);
  } catch (error) {
    next(error);
  }
});

// Get Stripe config
router.get("/stripe/config", async (_req, res, next) => {
  try {
    const config = await getStripeConfig(appContext);
    res.json(config);
  } catch (error) {
    next(error);
  }
});

// Get subscription plans
router.get("/plans", async (_req, res, next) => {
  try {
    const result = await listPlans();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Create checkout session
router.post("/checkout", requireAuth, async (req, res, next) => {
  try {
    const { priceId, successUrl, cancelUrl } = req.body;
    const session = await createCheckoutSessionFlow(appContext, {
      user: req.user!,
      priceId,
      successUrl,
      cancelUrl,
    });
    res.json(session);
  } catch (error) {
    if (error instanceof Error && error.message === "Stripe not configured") {
      return res.status(503).json({ error: error.message });
    }
    next(error);
  }
});

// Create portal session
router.post("/portal", requireAuth, async (req, res, next) => {
  try {
    const session = await createPortalSessionFlow(appContext, {
      user: req.user!,
      returnUrl: `${process.env.APP_URL}/settings`,
    });
    res.json({ url: session.url });
  } catch (error) {
    if (error instanceof Error && error.message === "Stripe not configured") {
      return res.status(503).json({ error: error.message });
    }
    if (error instanceof Error && error.message === "No subscription found") {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
});

// Change subscription tier
router.post("/change", requireAuth, async (req, res, next) => {
  try {
    const { newTier } = req.body;
    if (!req.user!.stripeSubscriptionId) {
      return res.status(400).json({ error: "No active subscription" });
    }
    await changeSubscriptionTier(appContext, { user: req.user!, newTier });
    res.json({ success: true, tier: newTier });
  } catch (error) {
    next(error);
  }
});

// Cancel subscription
router.post("/cancel", requireAuth, async (req, res, next) => {
  try {
    await cancelSubscription(appContext, { user: req.user! });
    res.json({ success: true, message: "Subscription will be canceled at period end" });
  } catch (error) {
    if (error instanceof Error && error.message === "Stripe not configured") {
      return res.status(503).json({ error: error.message });
    }
    if (error instanceof Error && error.message === "No active subscription") {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
});

// Resume subscription
router.post("/resume", requireAuth, async (req, res, next) => {
  try {
    await resumeSubscription(appContext, { user: req.user! });
    res.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Stripe not configured") {
      return res.status(503).json({ error: error.message });
    }
    if (error instanceof Error && error.message === "No active subscription") {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
});

// Get invoices
router.get("/invoices", requireAuth, async (req, res, next) => {
  try {
    const invoices = await listInvoices(appContext, req.user!);
    res.json(invoices);
  } catch (error) {
    next(error);
  }
});

// Get feature flags for subscription
router.get("/feature-flags", async (_req, res, next) => {
  try {
    const flags = await listEnabledFeatureFlags(appContext);
    res.json(flags);
  } catch (error) {
    next(error);
  }
});

// Admin: Update user tier
router.post("/admin/users/:userId/tier", requireAdmin, async (req, res, next) => {
  try {
    const { tier } = req.body;
    await adminUpdateUserTier(appContext, { userId: req.params.userId, tier });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Admin: Update user subscription status
router.post("/admin/users/:userId/subscription", requireAdmin, async (req, res, next) => {
  try {
    const { status, periodEnd } = req.body;
    await adminUpdateUserSubscription(appContext, {
      userId: req.params.userId,
      status,
      periodEnd: periodEnd ? new Date(periodEnd) : undefined,
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export { router as subscriptionRouter };
