/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import { storage } from "../storage";
import {
  logAuditEvent,
  logClinicianAction,
  logPatientAction,
  logSystemAction,
} from "../infrastructure/audit";
import {
  sendAssessmentInviteEmail,
  sendContentEmail,
  sendPasswordResetEmail,
} from "../infrastructure/email/email-adapter";
import {
  getAllContentFromContentful,
  getContentByIdFromContentful,
  getAllPathwaysFromContentful,
  getPathwayByIdFromContentful,
  isContentfulConfigured,
} from "../infrastructure/cms";
import { getStripePublishableKey, getStripeSync, getUncachableStripeClient } from "../infrastructure/payment/stripe-client";
import { runMigrations } from "stripe-replit-sync";
import type {
  AppContext,
  AuditLogger,
  CmsService,
  EmailService,
  PaymentService,
} from "./context";

const stubEmailService: EmailService = {
  async sendContentEmail() {
    throw new Error("Email service not configured in this context");
  },
  async sendAssessmentInviteEmail() {
    throw new Error("Email service not configured in this context");
  },
};

const stubCmsService: CmsService = {
  isConfigured() {
    return false;
  },
  async getAllContent() {
    return [];
  },
  async getContentById() {
    return null;
  },
};

const infrastructureEmailService: EmailService = {
  sendContentEmail,
  sendAssessmentInviteEmail,
  sendPasswordResetEmail,
};

const infrastructureCmsService: CmsService = {
  isConfigured: isContentfulConfigured,
  getAllContent: getAllContentFromContentful,
  getContentById: getContentByIdFromContentful,
  getAllPathways: getAllPathwaysFromContentful,
  getPathwayById: getPathwayByIdFromContentful,
};

async function requireStripeSync() {
  const stripeSync = await getStripeSync();
  if (!stripeSync) {
    throw new Error("Stripe not configured");
  }
  return stripeSync;
}

async function getStripeClient() {
  return getUncachableStripeClient();
}

const infrastructurePaymentService: PaymentService = {
  async createCheckoutSession(params) {
    await requireStripeSync();
    const stripe = await getStripeClient();
    let customerId = params.customerId ?? null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: params.userEmail,
        metadata: { userId: params.userId },
      });
      customerId = customer.id;
    }

    if (!customerId) {
      throw new Error("Stripe customer ID unavailable");
    }
    const resolvedCustomerId = customerId;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: params.priceId, quantity: 1 }],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    });

    return { url: session.url ?? null, customerId: resolvedCustomerId, sessionId: session.id };
  },
  async createPortalSession(params) {
    await requireStripeSync();
    const stripe = await getStripeClient();
    const session = await stripe.billingPortal.sessions.create({
      customer: params.customerId,
      return_url: params.returnUrl,
    });
    return { url: session.url! };
  },
  async listInvoices(params) {
    await requireStripeSync();
    const stripe = await getStripeClient();
    const invoices: {
      data: Array<{
        id: string;
        amount_paid: number;
        status: string | null;
        created: number;
        invoice_pdf: string | null;
      }>;
    } = await stripe.invoices.list({
      customer: params.customerId,
      limit: params.limit ?? 10,
    });
    return invoices.data.map((inv) => ({
      id: inv.id,
      amount: inv.amount_paid,
      status: inv.status,
      date: inv.created,
      pdfUrl: inv.invoice_pdf,
    }));
  },
  async cancelSubscription(params) {
    await requireStripeSync();
    const stripe = await getStripeClient();
    await stripe.subscriptions.update(params.subscriptionId, {
      cancel_at_period_end: params.cancelAtPeriodEnd ?? true,
    });
  },
  async resumeSubscription(params) {
    await requireStripeSync();
    const stripe = await getStripeClient();
    await stripe.subscriptions.update(params.subscriptionId, {
      cancel_at_period_end: false,
    });
  },
  async updateSubscription(params) {
    await requireStripeSync();
    const stripe = await getStripeClient();
    const subscription = await stripe.subscriptions.retrieve(params.subscriptionId);
    await stripe.subscriptions.update(params.subscriptionId, {
      items: [{
        id: subscription.items.data[0].id,
        price: params.newPriceId,
      }],
      proration_behavior: 'create_prorations',
    });
  },
  async getPublishableKey() {
    try {
      return await getStripePublishableKey();
    } catch {
      return process.env.STRIPE_PUBLISHABLE_KEY;
    }
  },
  async processWebhook(payload, signature) {
    const stripeSync = await requireStripeSync();
    const stripe = await getStripeClient();
    
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      await stripeSync.getWebhookSecret()
    );
    
    await stripeSync.processWebhook(payload, signature);
    
    if (event.type === 'customer.subscription.created' || 
        event.type === 'customer.subscription.updated' ||
        event.type === 'checkout.session.completed') {
      
      let subscription = event.data.object as any;
      
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as any;
        if (session.subscription) {
          subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        } else {
          return;
        }
      }
      
      const customerId = subscription.customer;
      const user = await storage.getUserByStripeCustomerId(customerId);
      
      if (user) {
        const status = subscription.status;
        const subscriptionId = subscription.id;
        const currentPeriodEnd = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : undefined;
        
        const priceId = subscription.items?.data?.[0]?.price?.id;
        let tier: "free" | "basic" | "pro" | "enterprise" = "basic";
        if (priceId) {
          const tierFromPrice = await storage.getTierFromPriceId(priceId);
          if (tierFromPrice && ["free", "basic", "pro", "enterprise"].includes(tierFromPrice)) {
            tier = tierFromPrice as "free" | "basic" | "pro" | "enterprise";
          }
        }
        
        const subscriptionStatus =
          status === "active" || status === "trialing"
            ? "active"
            : status === "past_due"
            ? "past_due"
            : status === "canceled"
            ? "canceled"
            : "inactive";
        
        await storage.updateUserSubscription(user.id, {
          stripeSubscriptionId: subscriptionId,
          subscriptionStatus,
          subscriptionPeriodEnd: currentPeriodEnd,
        });
        
        await storage.updateSubscriptionTier(user.id, tier);
        
        console.log(`Updated user ${user.id} subscription: tier=${tier}, status=${subscriptionStatus}`);
      }
    } else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as any;
      const customerId = subscription.customer;
      const user = await storage.getUserByStripeCustomerId(customerId);
      
      if (user) {
        await storage.updateUserSubscription(user.id, {
          subscriptionStatus: "canceled",
        });
        console.log(`Canceled subscription for user ${user.id}`);
      }
    }
  },
  async getSubscriptionStatus(customerId) {
    await requireStripeSync();
    const stripe = await getStripeClient();
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: "all",
    });
    const subscription = subscriptions.data[0];
    if (!subscription) {
      return null;
    }
    return {
      status: subscription.status,
      currentPeriodEnd: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000)
        : undefined,
    };
  },
  async getSubscription(subscriptionId) {
    await requireStripeSync();
    const stripe = await getStripeClient();
    return await stripe.subscriptions.retrieve(subscriptionId);
  },
  async getPaymentMethods(customerId) {
    await requireStripeSync();
    const stripe = await getStripeClient();
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });
    return paymentMethods.data;
  },
  async applyCoupon(subscriptionId, couponCode) {
    await requireStripeSync();
    const stripe = await getStripeClient();
    return await stripe.subscriptions.update(subscriptionId, {
      coupon: couponCode,
    });
  },
  async runSync(options) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL not set");
    }

    await runMigrations({ databaseUrl });

    const stripeSync = await requireStripeSync();

    if (options?.webhookUrl) {
      try {
        await stripeSync.findOrCreateManagedWebhook(options.webhookUrl);
      } catch (error: any) {
        console.log("Webhook setup skipped:", error?.message || "Unknown error");
      }
    }

    await stripeSync.syncBackfill();
  },
};

export function createAppContext(overrides?: Partial<AppContext>): AppContext {
  const defaultAudit: AuditLogger = {
    logAuditEvent,
    logClinicianAction,
    logPatientAction,
    logSystemAction,
  };

  return {
    storage: overrides?.storage ?? storage,
    audit: {
      ...defaultAudit,
      ...(overrides?.audit ?? {}),
    },
    email: overrides?.email ?? stubEmailService,
    cms: overrides?.cms ?? stubCmsService,
    payment: overrides?.payment,
    now: overrides?.now ?? (() => new Date()),
  };
}

export function createAppContextWithInfrastructure(
  overrides?: Partial<AppContext>
): AppContext {
  return createAppContext({
    email: infrastructureEmailService,
    cms: infrastructureCmsService,
    payment: infrastructurePaymentService,
    ...overrides,
  });
}

export function createMinimalContext(): AppContext {
  return createAppContext();
}
