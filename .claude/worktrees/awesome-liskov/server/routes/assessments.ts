/**
 * Architecture: Routes layer (HTTP adapter). Validates requests, calls application services, returns responses.
 */

import { Router } from "express";
import { requireSubscription } from "../auth";
import { insertAssessmentSchema, insertInternalScreeningSchema } from "@shared/schema";
import {
  AppError,
  createAppContextWithInfrastructure,
  createAssessment,
  createInternalScreening,
  deleteAssessment,
  getAssessment,
  getAssessmentQuestions,
  listAssessments,
  listInternalScreenings,
  scoreAssessment,
  updateAssessment,
} from "../application";
import { buildAuditRequestContext } from "../http/audit-context";

const router = Router();
const appContext = createAppContextWithInfrastructure();

// Get all assessments
router.get("/", requireSubscription, async (req, res, next) => {
  try {
    const typeFilter = req.query.type as string | undefined;
    const assessments = await listAssessments(appContext, {
      auditContext: buildAuditRequestContext(req),
      clinician: req.user!,
      typeFilter,
    });
    res.json(assessments);
  } catch (error) {
    next(error);
  }
});

// Get single assessment
router.get("/:id", requireSubscription, async (req, res, next) => {
  try {
    const assessment = await getAssessment(appContext, {
      auditContext: buildAuditRequestContext(req),
      clinician: req.user!,
      assessmentId: req.params.id,
    });
    if (!assessment) {
      return res.status(404).send("Assessment not found");
    }
    res.json(assessment);
  } catch (error) {
    next(error);
  }
});

// Get assessment questions
router.get("/:id/questions", requireSubscription, async (req, res, next) => {
  try {
    const result = await getAssessmentQuestions(appContext, {
      assessmentId: req.params.id,
    });
    if (!result) {
      return res.status(404).send("Assessment not found");
    }
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Create assessment
router.post("/", requireSubscription, async (req, res, next) => {
  try {
    const data = insertAssessmentSchema.parse({
      ...req.body,
      clinicianUserId: req.user!.id,
    });
    const assessment = await createAssessment(appContext, {
      auditContext: buildAuditRequestContext(req),
      clinician: req.user!,
      data,
    });
    res.status(201).json(assessment);
  } catch (error) {
    next(error);
  }
});

// Update assessment
router.patch("/:id", requireSubscription, async (req, res, next) => {
  try {
    const assessment = await updateAssessment(appContext, {
      auditContext: buildAuditRequestContext(req),
      clinician: req.user!,
      assessmentId: req.params.id,
      updates: req.body,
    });
    res.json(assessment);
  } catch (error) {
    next(error);
  }
});

// Delete assessment
router.delete("/:id", requireSubscription, async (req, res, next) => {
  try {
    await deleteAssessment(appContext, {
      auditContext: buildAuditRequestContext(req),
      clinician: req.user!,
      assessmentId: req.params.id,
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Score assessment
router.post("/score", requireSubscription, async (req, res, next) => {
  try {
    const { assessmentId, answers } = req.body;

    const result = await scoreAssessment(appContext, {
      auditContext: buildAuditRequestContext(req),
      clinician: req.user!,
      assessmentId,
      answers,
    });

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

export { router as assessmentsRouter };

// Internal Screenings Router
const screeningsRouter = Router();

// Create internal screening
screeningsRouter.post("/", requireSubscription, async (req, res, next) => {
  try {
    const data = insertInternalScreeningSchema.parse({
      ...req.body,
      clinicianUserId: req.user!.id,
    });
    const screening = await createInternalScreening(appContext, {
      auditContext: buildAuditRequestContext(req),
      clinician: req.user!,
      data,
    });
    res.status(201).json(screening);
  } catch (error) {
    next(error);
  }
});

// Get internal screenings
screeningsRouter.get("/", requireSubscription, async (req, res, next) => {
  try {
    const screenings = await listInternalScreenings(appContext, {
      auditContext: buildAuditRequestContext(req),
      clinician: req.user!,
    });
    res.json(screenings);
  } catch (error) {
    next(error);
  }
});

export { screeningsRouter as internalScreeningsRouter };
