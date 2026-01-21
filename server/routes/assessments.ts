import { Router } from "express";
import { requireSubscription } from "../auth";
import { storage } from "../storage";
import { insertAssessmentSchema, insertInternalScreeningSchema } from "@shared/schema";
import { logClinicianAction } from "../audit";
import { scoreAssessmentResponse } from "../scoring";

const router = Router();

// Get all assessments
router.get("/", requireSubscription, async (req, res, next) => {
  try {
    const typeFilter = req.query.type as string | undefined;
    const assessments = await storage.getAssessmentsByClinicianId(req.user!.id);
    
    await logClinicianAction(req, req.user!, 'assessment_access', {
      resourceType: 'assessment',
      details: { count: assessments.length, typeFilter },
    });
    
    res.json(assessments);
  } catch (error) {
    next(error);
  }
});

// Get single assessment
router.get("/:id", requireSubscription, async (req, res, next) => {
  try {
    const assessment = await storage.getAssessmentById(req.params.id);
    if (!assessment) {
      return res.status(404).send("Assessment not found");
    }
    
    await logClinicianAction(req, req.user!, 'assessment_access', {
      resourceType: 'assessment',
      resourceId: req.params.id,
      details: { name: assessment.name },
    });
    
    res.json(assessment);
  } catch (error) {
    next(error);
  }
});

// Get assessment questions
router.get("/:id/questions", requireSubscription, async (req, res, next) => {
  try {
    const assessment = await storage.getAssessmentById(req.params.id);
    if (!assessment) {
      return res.status(404).send("Assessment not found");
    }
    
    // Parse the surveyJson to extract questions for display
    const surveyJson = assessment.surveyJson as any;
    let questions: any[] = [];
    
    if (surveyJson) {
      // SurveyJS stores questions either at root level or within pages
      if (surveyJson.questions) {
        questions = surveyJson.questions;
      } else if (surveyJson.pages) {
        // Extract questions from all pages
        questions = surveyJson.pages.flatMap((page: any) => page.elements || []);
      }
    }
    
    // Map questions to a simpler format for display
    const mappedQuestions = questions.map((q: any, index: number) => ({
      id: q.name || `question_${index}`,
      type: q.type || 'text',
      title: q.title || q.name || `Question ${index + 1}`,
      description: q.description,
      required: q.isRequired || false,
      choices: q.choices || q.rateValues,
      rateMin: q.rateMin,
      rateMax: q.rateMax,
      minRateDescription: q.minRateDescription,
      maxRateDescription: q.maxRateDescription,
      tags: q.tags || [],
    }));
    
    res.json({
      assessmentId: assessment.id,
      assessmentName: assessment.name,
      questions: mappedQuestions,
      totalQuestions: mappedQuestions.length,
    });
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
    const assessment = await storage.createAssessment(data);
    
    await logClinicianAction(req, req.user!, 'assessment_create', {
      resourceType: 'assessment',
      resourceId: assessment.id,
      details: { name: assessment.name },
    });
    
    res.status(201).json(assessment);
  } catch (error) {
    next(error);
  }
});

// Update assessment
router.patch("/:id", requireSubscription, async (req, res, next) => {
  try {
    const assessment = await storage.updateAssessment(req.params.id, req.body);
    
    await logClinicianAction(req, req.user!, 'assessment_update', {
      resourceType: 'assessment',
      resourceId: req.params.id,
      details: { name: assessment?.name },
    });
    
    res.json(assessment);
  } catch (error) {
    next(error);
  }
});

// Delete assessment
router.delete("/:id", requireSubscription, async (req, res, next) => {
  try {
    await logClinicianAction(req, req.user!, 'assessment_delete', {
      resourceType: 'assessment',
      resourceId: req.params.id,
    });
    
    await storage.deleteAssessment(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Score assessment
router.post("/score", requireSubscription, async (req, res, next) => {
  try {
    const { assessmentId, answers } = req.body;
    const assessment = await storage.getAssessmentById(assessmentId);
    if (!assessment) {
      return res.status(404).send("Assessment not found");
    }
    
    const result = await scoreAssessmentResponse(assessmentId, answers);
    
    await logClinicianAction(req, req.user!, 'assessment_score', {
      resourceType: 'assessment',
      resourceId: assessmentId,
      details: { tagCount: result.tagScores.length },
    });
    
    res.json(result);
  } catch (error) {
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
    const screening = await storage.createInternalScreening(data);
    
    await logClinicianAction(req, req.user!, 'assessment_create', {
      resourceType: 'screening',
      resourceId: screening.id,
      phiAccessed: true,
      phiScope: 'patient name, screening results',
      details: { patientName: screening.patientName },
    });
    
    res.status(201).json(screening);
  } catch (error) {
    next(error);
  }
});

// Get internal screenings
screeningsRouter.get("/", requireSubscription, async (req, res, next) => {
  try {
    const screenings = await storage.getInternalScreeningsByClinicianId(req.user!.id);
    
    await logClinicianAction(req, req.user!, 'assessment_access', {
      resourceType: 'screening',
      phiAccessed: true,
      phiScope: 'patient names in screening list',
      details: { count: screenings.length },
    });
    
    res.json(screenings);
  } catch (error) {
    next(error);
  }
});

export { screeningsRouter as internalScreeningsRouter };
