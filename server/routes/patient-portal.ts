import type { Express, NextFunction, Request, Response } from "express";
import { getContentByIdFromContentful, isContentfulConfigured } from "../contentful";
import { authenticatePatient, AppError, createAppContext, listPatientContent } from "../application";
import { logClinicianAction, logPatientAction, logSystemAction } from "../audit";
import { storage } from "../storage";

type FeatureFlagMiddleware = (flagKey: string) => (req: Request, res: Response, next: NextFunction) => void;

export function registerPatientPortalRoutes(app: Express, requireFeatureFlag: FeatureFlagMiddleware) {
  const appContext = createAppContext({
    storage,
    audit: { logClinicianAction, logPatientAction, logSystemAction },
    cms: {
      isConfigured: isContentfulConfigured,
      getAllContent: async () => [],
      getContentById: getContentByIdFromContentful,
    },
  });

  app.post("/api/patient-portal/auth", requireFeatureFlag("patient_portal_enabled"), async (req, res, next) => {
    try {
      const { email, accessCode } = req.body;

      const result = await authenticatePatient(appContext, req, {
        email,
        accessCode,
      });

      res.json({
        success: true,
        patientEmail: result.patientEmail,
        sessionToken: result.sessionToken,
      });
    } catch (error) {
      if (error instanceof AppError) {
        if (typeof error.body === "string") {
          return res.status(error.status).send(error.body);
        }
        return res.status(error.status).json(error.body ?? { error: error.message });
      }
      next(error);
    }
  });

  app.get("/api/patient-portal/content", requireFeatureFlag("patient_portal_enabled"), async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Authorization required" });
      }
      
      const sessionToken = authHeader.slice(7);
      const result = await listPatientContent(appContext, { req, sessionToken });

      res.json(result);
    } catch (error) {
      if (error instanceof AppError) {
        if (typeof error.body === "string") {
          return res.status(error.status).send(error.body);
        }
        return res.status(error.status).json(error.body ?? { error: error.message });
      }
      next(error);
    }
  });
}
