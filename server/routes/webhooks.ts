/**
 * Architecture: Routes layer (HTTP adapter). Validates requests, calls application services, returns responses.
 */

import type { Express } from "express";
import express from "express";
import { createAppContextWithInfrastructure, processStripeWebhook } from "../application";

export function registerWebhookRoutes(app: Express) {
  const appContext = createAppContextWithInfrastructure();

  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const signature = req.headers["stripe-signature"];

      if (!signature) {
        return res.status(400).json({ error: "Missing stripe-signature" });
      }

      try {
        const sig = Array.isArray(signature) ? signature[0] : signature;

        if (!Buffer.isBuffer(req.body)) {
          console.error("STRIPE WEBHOOK ERROR: req.body is not a Buffer");
          return res.status(500).json({ error: "Webhook processing error" });
        }

        await processStripeWebhook(appContext, req.body as Buffer, sig);

        res.status(200).json({ received: true });
      } catch (error: any) {
        console.error("Webhook error:", error.message);
        res.status(400).json({ error: "Webhook processing error" });
      }
    }
  );
}
