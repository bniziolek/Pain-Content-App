/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import { createAppContextWithInfrastructure } from "../context-helpers";

function backgroundJobsEnabled() {
  return process.env.BACKGROUND_JOBS_ENABLED !== "false";
}

function stripeSyncEnabled() {
  return process.env.STRIPE_SYNC_ENABLED !== "false";
}

export async function startBackgroundJobs(ctx: AppContext = createAppContextWithInfrastructure()) {
  if (!backgroundJobsEnabled()) {
    console.log("Background jobs disabled");
    return;
  }

  startSessionCleanupJob(ctx);

  if (stripeSyncEnabled()) {
    await initStripeSync(ctx);
  }
}

function startSessionCleanupJob(ctx: AppContext) {
  setInterval(async () => {
    try {
      const count = await ctx.storage.invalidateExpiredSessions();
      if (count > 0) {
        console.log(`[Session cleanup] Invalidated ${count} expired patient sessions`);
      }
    } catch (error) {
      console.error("[Session cleanup] Error:", error);
    }
  }, 60 * 60 * 1000);
}

async function initStripeSync(ctx: AppContext) {
  if (!ctx.payment?.runSync) {
    console.log("Stripe payment service not configured, skipping sync");
    return;
  }

  if (!process.env.DATABASE_URL) {
    console.log("DATABASE_URL not set, skipping Stripe initialization");
    return;
  }

  try {
    console.log("Initializing Stripe schema...");
    const domain = process.env.REPLIT_DOMAINS?.split(",")[0];
    if (!domain) {
      console.log("Webhook setup skipped: REPLIT_DOMAINS not set");
    } else {
      console.log("Setting up managed webhook...");
    }

    console.log("Syncing Stripe data...");
    await ctx.payment.runSync({
      webhookUrl: domain ? `https://${domain}/api/stripe/webhook` : undefined,
    });
    console.log("Stripe data synced");
  } catch (error) {
    console.error("Failed to initialize Stripe:", error);
  }
}
