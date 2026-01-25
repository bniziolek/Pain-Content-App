/**
 * Architecture: Routes layer (HTTP adapter). Validates requests, calls application services, returns responses.
 */

import type { Express, RequestHandler } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "../auth";
import { createAppContext, getFeatureFlag } from "../application";

// Domain Routers
import { contentRouter } from "./content";
import { favoritesRouter } from "./favorites";
import { collectionsRouter } from "./collections";
import { assessmentsRouter, internalScreeningsRouter } from "./assessments";
import { createAssessmentInvitesRouter } from "./assessment-invites";
import { recommendationsRouter, createPatientRecommendationsRouter } from "./recommendations";
import { createMessagingRouter, emailSettingsRouter, patientSummaryRouter } from "./messaging";
import { pathwaysRouter, followUpRouter } from "./pathways";
import { subscriptionRouter } from "./subscription";
import { statsRouter } from "./stats";
import { adminRouter } from "./admin";
import { featureFlagsRouter } from "./feature-flags";
import { pdfRouter } from "./pdf";
import { complianceRouter } from "./compliance";
import { onboardingRouter } from "./onboarding";
import { contentRecommendationsRouter } from "./content-recommendations";
import { brandingRouter } from "./branding";

// Function-based route registrations
import { registerPasswordResetRoutes } from "./password-reset";
import { registerPublicContentRoutes } from "./public-content";
import { registerPatientPortalRoutes } from "./patient-portal";
import { registerAuthRoutes } from "./auth";
import { packetAccessCodesRouter, registerPublicAccessCodeRoutes } from "./packet-access-codes";

// Feature flag middleware factory
const createFeatureFlagMiddleware = () => {
  const appContext = createAppContext();
  return (flagKey: string): RequestHandler => {
    return async (req, res, next) => {
      try {
        const flag = await getFeatureFlag(appContext, { key: flagKey });
        if (!flag?.isEnabled) {
          return res.status(404).json({ error: "Not found" });
        }
        next();
      } catch (error) {
        next(error);
      }
    };
  };
};

export function registerRoutes(app: Express): Server {
  // Create feature flag middleware
  const requireFeatureFlag = createFeatureFlagMiddleware();

  // Setup authentication routes
  setupAuth(app);
  registerAuthRoutes(app);
  
  // Function-based route registrations
  registerPasswordResetRoutes(app);
  registerPublicContentRoutes(app);
  registerPatientPortalRoutes(app, requireFeatureFlag);

  // ====== Content Domain ======
  app.use("/api/content", contentRouter);
  app.use("/api/favorites", favoritesRouter);
  app.use("/api/collections", collectionsRouter);
  app.use("/api/content-recommendations", contentRecommendationsRouter);

  // ====== Assessments Domain ======
  app.use("/api/assessments", assessmentsRouter);
  app.use("/api/internal-screenings", internalScreeningsRouter);
  app.use("/api/assessment-invites", createAssessmentInvitesRouter(requireFeatureFlag));

  // ====== Recommendations Domain ======
  app.use("/api/recommendations", recommendationsRouter);
  app.use("/api/recommendation-rules", recommendationsRouter); // Backward-compatible alias
  app.use("/api/recommendation-configs", recommendationsRouter); // Backward-compatible alias
  app.use("/api/patient-recommendations", createPatientRecommendationsRouter(requireFeatureFlag));

  // ====== Messaging Domain ======
  const messagingRouter = createMessagingRouter(requireFeatureFlag);
  app.use("/api", messagingRouter);
  app.use("/api/email-settings", emailSettingsRouter);
  app.use("/api/patient-summary", patientSummaryRouter);

  // ====== Pathways Domain ======
  app.use("/api/pathways", pathwaysRouter);
  app.use("/api/follow-up-rules", followUpRouter);

  // ====== Subscription Domain ======
  app.use("/api/subscription", subscriptionRouter);
  app.get("/api/stripe/config", subscriptionRouter);

  // ====== Stats & Dashboard ======
  app.use("/api/stats", statsRouter);

  // ====== Admin Domain ======
  app.use("/api/admin", adminRouter);

  // ====== Feature Flags Domain ======
  app.use("/api/feature-flags", featureFlagsRouter);

  // ====== PDF Generation ======
  app.use("/api", pdfRouter);

  // ====== Packet Access Codes ======
  app.use("/api/packets", packetAccessCodesRouter);
  registerPublicAccessCodeRoutes(app);

  // ====== Compliance & Audit ======
  app.use("/api", complianceRouter);

  // ====== Onboarding ======
  app.use("/api/onboarding", onboardingRouter);

  // ====== Branding ======
  app.use("/api/branding", brandingRouter);

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Create HTTP server
  const httpServer = createServer(app);
  
  return httpServer;
}

export default registerRoutes;
