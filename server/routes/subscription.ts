import { Router } from "express";
import { requireAuth, requireAdmin } from "../auth";
import { storage } from "../storage";
import { getStripeSync } from "../stripeClient";
import Stripe from "stripe";

const router = Router();

// Get subscription status
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const user = req.user!;
    res.json({
      status: user.subscriptionStatus,
      tier: user.subscriptionTier,
      periodEnd: user.subscriptionPeriodEnd,
      stripeCustomerId: user.stripeCustomerId,
    });
  } catch (error) {
    next(error);
  }
});

// Get Stripe config
router.get("/stripe/config", async (_req, res, next) => {
  try {
    const stripeSync = await getStripeSync();
    const config = stripeSync?.getConfig();
    res.json({
      publishableKey: config?.publishableKey || process.env.STRIPE_PUBLISHABLE_KEY,
    });
  } catch (error) {
    next(error);
  }
});

// Get subscription plans
router.get("/plans", async (_req, res, next) => {
  try {
    // Return hardcoded plans or fetch from Stripe
    res.json([
      {
        id: 'basic',
        name: 'Basic',
        price: 29,
        interval: 'month',
        features: ['Content library access', 'Patient messaging', 'Basic assessments'],
      },
      {
        id: 'pro',
        name: 'Pro',
        price: 79,
        interval: 'month',
        features: ['Everything in Basic', 'Care pathways', 'Follow-up automation', 'Advanced analytics'],
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price: 199,
        interval: 'month',
        features: ['Everything in Pro', 'Custom branding', 'API access', 'Priority support'],
      },
    ]);
  } catch (error) {
    next(error);
  }
});

// Create checkout session
router.post("/checkout", requireAuth, async (req, res, next) => {
  try {
    const { priceId, successUrl, cancelUrl } = req.body;
    const stripeSync = await getStripeSync();
    
    if (!stripeSync) {
      return res.status(503).json({ error: "Stripe not configured" });
    }
    
    const stripe = stripeSync.getStripe();
    let customerId = req.user!.stripeCustomerId;
    
    // Create customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user!.email,
        metadata: { userId: req.user!.id },
      });
      customerId = customer.id;
      await storage.updateUser(req.user!.id, { stripeCustomerId: customerId });
    }
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl || `${process.env.APP_URL}/settings?success=true`,
      cancel_url: cancelUrl || `${process.env.APP_URL}/settings?canceled=true`,
    });
    
    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    next(error);
  }
});

// Create portal session
router.post("/portal", requireAuth, async (req, res, next) => {
  try {
    const stripeSync = await getStripeSync();
    
    if (!stripeSync) {
      return res.status(503).json({ error: "Stripe not configured" });
    }
    
    const stripe = stripeSync.getStripe();
    const customerId = req.user!.stripeCustomerId;
    
    if (!customerId) {
      return res.status(400).json({ error: "No subscription found" });
    }
    
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.APP_URL}/settings`,
    });
    
    res.json({ url: session.url });
  } catch (error) {
    next(error);
  }
});

// Change subscription tier
router.post("/change", requireAuth, async (req, res, next) => {
  try {
    const { newTier } = req.body;
    const stripeSync = await getStripeSync();
    
    if (!stripeSync) {
      return res.status(503).json({ error: "Stripe not configured" });
    }
    
    const stripe = stripeSync.getStripe();
    const subscriptionId = req.user!.stripeSubscriptionId;
    
    if (!subscriptionId) {
      return res.status(400).json({ error: "No active subscription" });
    }
    
    // This would need price IDs mapped to tiers
    // For now just update local tier
    await storage.updateUserSubscription(req.user!.id, {
      subscriptionTier: newTier,
    });
    
    res.json({ success: true, tier: newTier });
  } catch (error) {
    next(error);
  }
});

// Cancel subscription
router.post("/cancel", requireAuth, async (req, res, next) => {
  try {
    const stripeSync = await getStripeSync();
    
    if (!stripeSync) {
      return res.status(503).json({ error: "Stripe not configured" });
    }
    
    const stripe = stripeSync.getStripe();
    const subscriptionId = req.user!.stripeSubscriptionId;
    
    if (!subscriptionId) {
      return res.status(400).json({ error: "No active subscription" });
    }
    
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
    
    res.json({ success: true, message: "Subscription will be canceled at period end" });
  } catch (error) {
    next(error);
  }
});

// Resume subscription
router.post("/resume", requireAuth, async (req, res, next) => {
  try {
    const stripeSync = await getStripeSync();
    
    if (!stripeSync) {
      return res.status(503).json({ error: "Stripe not configured" });
    }
    
    const stripe = stripeSync.getStripe();
    const subscriptionId = req.user!.stripeSubscriptionId;
    
    if (!subscriptionId) {
      return res.status(400).json({ error: "No active subscription" });
    }
    
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Get invoices
router.get("/invoices", requireAuth, async (req, res, next) => {
  try {
    const stripeSync = await getStripeSync();
    
    if (!stripeSync || !req.user!.stripeCustomerId) {
      return res.json([]);
    }
    
    const stripe = stripeSync.getStripe();
    const invoices = await stripe.invoices.list({
      customer: req.user!.stripeCustomerId,
      limit: 10,
    });
    
    res.json(invoices.data.map(inv => ({
      id: inv.id,
      amount: inv.amount_paid,
      status: inv.status,
      date: inv.created,
      pdfUrl: inv.invoice_pdf,
    })));
  } catch (error) {
    next(error);
  }
});

// Get feature flags for subscription
router.get("/feature-flags", async (_req, res, next) => {
  try {
    const flags = await storage.getAllFeatureFlags();
    res.json(flags.filter(f => f.isEnabled));
  } catch (error) {
    next(error);
  }
});

// Admin: Update user tier
router.post("/admin/users/:userId/tier", requireAdmin, async (req, res, next) => {
  try {
    const { tier } = req.body;
    await storage.updateUserSubscription(req.params.userId, {
      subscriptionTier: tier,
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Admin: Update user subscription status
router.post("/admin/users/:userId/subscription", requireAdmin, async (req, res, next) => {
  try {
    const { status, periodEnd } = req.body;
    await storage.updateUserSubscription(req.params.userId, {
      subscriptionStatus: status,
      subscriptionPeriodEnd: periodEnd ? new Date(periodEnd) : undefined,
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export { router as subscriptionRouter };
