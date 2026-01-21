import { runMigrations } from "stripe-replit-sync";
import { getStripeSync } from "./stripeClient";
import { storage } from "./storage";

function backgroundJobsEnabled() {
  return process.env.BACKGROUND_JOBS_ENABLED !== "false";
}

function stripeSyncEnabled() {
  return process.env.STRIPE_SYNC_ENABLED !== "false";
}

export async function startBackgroundJobs() {
  if (!backgroundJobsEnabled()) {
    console.log("Background jobs disabled");
    return;
  }

  startSessionCleanupJob();

  if (stripeSyncEnabled()) {
    await initStripeSync();
  }
}

function startSessionCleanupJob() {
  setInterval(async () => {
    try {
      const count = await storage.invalidateExpiredSessions();
      if (count > 0) {
        console.log(`[Session cleanup] Invalidated ${count} expired patient sessions`);
      }
    } catch (error) {
      console.error("[Session cleanup] Error:", error);
    }
  }, 60 * 60 * 1000);
}

async function initStripeSync() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.log("DATABASE_URL not set, skipping Stripe initialization");
    return;
  }

  try {
    console.log("Initializing Stripe schema...");
    await runMigrations({ 
      databaseUrl,
    });
    console.log("Stripe schema ready");

    const stripeSync = await getStripeSync();

    console.log("Setting up managed webhook...");
    const domain = process.env.REPLIT_DOMAINS?.split(",")[0];
    if (!domain) {
      console.log("Webhook setup skipped: REPLIT_DOMAINS not set");
    } else {
      try {
        const result = await stripeSync.findOrCreateManagedWebhook(
          `https://${domain}/api/stripe/webhook`,
        );
        if (result?.webhook?.url) {
          console.log(`Webhook configured: ${result.webhook.url}`);
        } else {
          console.log("Webhook endpoint registered (no URL returned)");
        }
      } catch (webhookError: any) {
        console.log("Webhook setup skipped:", webhookError.message || "Unknown error");
      }
    }

    console.log("Syncing Stripe data...");
    stripeSync.syncBackfill()
      .then(() => {
        console.log("Stripe data synced");
      })
      .catch((err: any) => {
        console.error("Error syncing Stripe data:", err);
      });
  } catch (error) {
    console.error("Failed to initialize Stripe:", error);
  }
}
