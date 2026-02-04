/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";

export interface AssessmentQuestion {
  id: string;
  type: string;
  title: string;
  description?: string;
  required: boolean;
  choices?: unknown;
  rateMin?: number;
  rateMax?: number;
  minRateDescription?: string;
  maxRateDescription?: string;
  tags?: string[];
}

export interface GetAssessmentQuestionsInput {
  assessmentId: string;
}

export interface GetAssessmentQuestionsResult {
  assessmentId: string;
  assessmentName: string;
  questions: AssessmentQuestion[];
  totalQuestions: number;
}

export async function getAssessmentQuestions(
  ctx: AppContext,
  input: GetAssessmentQuestionsInput
): Promise<GetAssessmentQuestionsResult | null> {
  const assessment = await ctx.storage.getAssessmentById(input.assessmentId);
  if (!assessment) {
    return null;
  }

  const surveyJson = assessment.surveyJson as {
    questions?: unknown[];
    pages?: Array<{ elements?: unknown[] }>;
  } | null;
  let questions: any[] = [];

  if (surveyJson) {
    if (surveyJson.questions) {
      questions = surveyJson.questions as any[];
    } else if (surveyJson.pages) {
      questions = surveyJson.pages.flatMap((page) => page.elements || []);
    }
  }

  const mappedQuestions = questions.map((q: any, index: number) => ({
    id: q.name || `question_${index}`,
    type: q.type || "text",
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

  return {
    assessmentId: assessment.id,
    assessmentName: assessment.name,
    questions: mappedQuestions,
    totalQuestions: mappedQuestions.length,
  };
}
