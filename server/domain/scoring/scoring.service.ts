export interface TagScore {
  tag: string;
  score: number;
  maxScore: number;
  percentage: number;
}

export interface ScoringResult {
  tagScores: TagScore[];
  primaryOutcome: string | null;
  recommendations: string[];
}

export interface ScoringConfig {
  tags: {
    [tagName: string]: {
      questionWeights: {
        [questionName: string]: {
          weight: number;
          valueMapping?: { [answerValue: string]: number };
          scale?: { min: number; max: number };
        };
      };
      threshold?: number;
    };
  };
}

export interface OutcomeRule {
  name: string;
  conditions: {
    tag: string;
    operator: ">" | "<" | ">=" | "<=" | "==" | "between";
    value: number;
    value2?: number;
  }[];
  logic?: "AND" | "OR";
  priority: number;
}

export interface OutcomeRules {
  rules: OutcomeRule[];
  defaultOutcome: string;
}

interface SurveyJson {
  pages?: Array<{
    elements?: SurveyElement[];
  }>;
}

interface SurveyElement {
  name?: string;
  type?: string;
  rateMax?: number;
  rateCount?: number;
  rateValues?: Array<{ value: number; text: string }>;
  choices?: Array<{ value: number | string; text: string } | number | string>;
  elements?: SurveyElement[];
}

interface QuestionMetadata {
  [questionName: string]: {
    type: string;
    minValue: number;
    maxValue: number;
    choiceCount?: number;
  };
}

export function extractQuestionMetadata(surveyJson: SurveyJson | null): QuestionMetadata {
  const metadata: QuestionMetadata = {};

  if (!surveyJson?.pages) return metadata;

  function processElements(elements: SurveyElement[]) {
    for (const element of elements) {
      if (element.name) {
        const type = element.type || "unknown";
        let minValue = 0;
        let maxValue = 4;
        let choiceCount: number | undefined;

        if (type === "rating") {
          maxValue = element.rateMax || element.rateCount || 5;
          minValue = 1;
          if (element.rateValues?.length) {
            const values = element.rateValues.map(v => v.value);
            minValue = Math.min(...values);
            maxValue = Math.max(...values);
          }
        } else if (type === "radiogroup" || type === "dropdown") {
          if (element.choices?.length) {
            choiceCount = element.choices.length;
            const numericChoices = element.choices
              .map(c => typeof c === "object" && c !== null ? (c as { value: number | string }).value : c)
              .filter(v => typeof v === "number") as number[];
            if (numericChoices.length > 0) {
              minValue = Math.min(...numericChoices);
              maxValue = Math.max(...numericChoices);
            } else {
              maxValue = element.choices.length - 1;
            }
          }
        } else if (type === "boolean") {
          minValue = 0;
          maxValue = 1;
        } else if (type === "checkbox") {
          choiceCount = element.choices?.length || 10;
          maxValue = choiceCount;
        }

        metadata[element.name] = { type, minValue, maxValue, choiceCount };
      }

      if (element.elements) {
        processElements(element.elements);
      }
    }
  }

  for (const page of surveyJson.pages) {
    if (page.elements) {
      processElements(page.elements);
    }
  }

  return metadata;
}

export function calculateTagScores(
  answers: Record<string, unknown>,
  scoringConfig: ScoringConfig | null,
  questionMetadata?: QuestionMetadata
): TagScore[] {
  if (!scoringConfig || !scoringConfig.tags) {
    return inferTagScoresFromAnswers(answers, questionMetadata || {});
  }

  const tagScores: TagScore[] = [];

  for (const [tagName, tagConfig] of Object.entries(scoringConfig.tags)) {
    let totalScore = 0;
    let maxPossibleScore = 0;

    for (const [questionName, questionConfig] of Object.entries(tagConfig.questionWeights)) {
      const answer = answers[questionName];
      if (answer === undefined) continue;

      const weight = questionConfig.weight;
      let questionScore = 0;

      if (questionConfig.valueMapping) {
        const answerStr = String(answer);
        questionScore = questionConfig.valueMapping[answerStr] ?? 0;
        const maxValue = Math.max(...Object.values(questionConfig.valueMapping));
        maxPossibleScore += maxValue * weight;
      } else if (questionConfig.scale) {
        const numAnswer = typeof answer === "number" ? answer : parseFloat(String(answer));
        if (!isNaN(numAnswer)) {
          const normalizedScore = (numAnswer - questionConfig.scale.min) /
            (questionConfig.scale.max - questionConfig.scale.min);
          questionScore = normalizedScore;
          maxPossibleScore += weight;
        }
      } else if (typeof answer === "number") {
        questionScore = answer;
        maxPossibleScore += 10 * weight;
      } else if (typeof answer === "boolean") {
        questionScore = answer ? 1 : 0;
        maxPossibleScore += weight;
      }

      totalScore += questionScore * weight;
    }

    const percentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

    tagScores.push({
      tag: tagName,
      score: Math.round(totalScore * 100) / 100,
      maxScore: Math.round(maxPossibleScore * 100) / 100,
      percentage: Math.round(percentage),
    });
  }

  return tagScores;
}

function inferTagScoresFromAnswers(
  answers: Record<string, unknown>,
  questionMetadata: QuestionMetadata
): TagScore[] {
  const inferredScores: Record<string, {
    values: Array<{ value: number; questionName: string }>;
    booleans: boolean[];
    arrays: Array<{ count: number; maxChoices: number }>;
    count: number
  }> = {};

  const tagMapping: Record<string, string> = {
    pain_intensity: "pain_severity",
    pain_level: "pain_severity",
    pain_location: "pain_complexity",
    pain_duration: "chronicity",
    pain_pattern: "pain_pattern",
    daily_activities: "functional_impact",
    fear_movement: "fear_avoidance",
    pain_cause_belief: "beliefs",
  };

  for (const [questionName, answer] of Object.entries(answers)) {
    const genericPattern = /^(question|q|item|element)\d*$/i;
    const tag = tagMapping[questionName] ||
      (genericPattern.test(questionName) ? "general" : questionName);

    if (!inferredScores[tag]) {
      inferredScores[tag] = { values: [], booleans: [], arrays: [], count: 0 };
    }

    if (typeof answer === "number") {
      inferredScores[tag].values.push({ value: answer, questionName });
      inferredScores[tag].count += 1;
    } else if (typeof answer === "boolean") {
      inferredScores[tag].booleans.push(answer);
      inferredScores[tag].count += 1;
    } else if (Array.isArray(answer)) {
      const meta = questionMetadata[questionName];
      const maxChoices = meta?.choiceCount || 10;
      inferredScores[tag].arrays.push({ count: answer.length, maxChoices });
      inferredScores[tag].count += 1;
    } else if (typeof answer === "object" && answer !== null) {
      const values = Object.values(answer as Record<string, unknown>);
      for (const val of values) {
        if (typeof val === "number") {
          inferredScores[tag].values.push({ value: val, questionName });
        }
      }
      inferredScores[tag].count += values.length;
    }
  }

  return Object.entries(inferredScores).map(([tag, data]) => {
    let score = 0;
    let maxScore = 0;

    if (data.values.length > 0) {
      const normalizedValues: number[] = [];

      for (const { value, questionName } of data.values) {
        const meta = questionMetadata[questionName];
        let minVal = 0;
        let maxVal = 4;

        if (meta) {
          minVal = meta.minValue;
          maxVal = meta.maxValue;
        }

        const range = maxVal - minVal;
        const normalized = range > 0 ? ((value - minVal) / range) * 100 : 0;
        normalizedValues.push(Math.min(100, Math.max(0, normalized)));
      }

      score = normalizedValues.reduce((a, b) => a + b, 0) / normalizedValues.length;
      maxScore = 100;
    }

    if (data.booleans.length > 0) {
      const trueCount = data.booleans.filter(b => b).length;
      const boolScore = (trueCount / data.booleans.length) * 100;
      if (data.values.length > 0) {
        score = (score + boolScore) / 2;
      } else {
        score = boolScore;
        maxScore = 100;
      }
    }

    if (data.arrays.length > 0) {
      const arrayScores = data.arrays.map(arr => (arr.count / arr.maxChoices) * 100);
      const avgArrayScore = arrayScores.reduce((a, b) => a + b, 0) / arrayScores.length;
      if (data.values.length > 0 || data.booleans.length > 0) {
        score = (score + avgArrayScore) / 2;
      } else {
        score = avgArrayScore;
        maxScore = 100;
      }
    }

    return {
      tag,
      score: Math.round(score * 100) / 100,
      maxScore: maxScore,
      percentage: Math.round(score),
    };
  });
}

export function determinePrimaryOutcome(
  tagScores: TagScore[],
  outcomeRules: OutcomeRules | null
): string | null {
  if (!outcomeRules || !outcomeRules.rules || outcomeRules.rules.length === 0) {
    return inferPrimaryOutcome(tagScores);
  }

  const sortedRules = [...outcomeRules.rules].sort((a, b) => b.priority - a.priority);

  for (const rule of sortedRules) {
    const logic = rule.logic || "AND";
    const results = rule.conditions.map((condition) => {
      const tagScore = tagScores.find((ts) => ts.tag === condition.tag);
      if (!tagScore) return false;

      const value = tagScore.percentage;

      switch (condition.operator) {
        case ">":
          return value > condition.value;
        case "<":
          return value < condition.value;
        case ">=":
          return value >= condition.value;
        case "<=":
          return value <= condition.value;
        case "==":
          return value === condition.value;
        case "between":
          return value >= condition.value && value <= (condition.value2 ?? 100);
        default:
          return false;
      }
    });

    const matches = logic === "AND" ? results.every((r) => r) : results.some((r) => r);
    if (matches) {
      return rule.name;
    }
  }

  return outcomeRules.defaultOutcome || null;
}

function inferPrimaryOutcome(tagScores: TagScore[]): string | null {
  if (tagScores.length === 0) return null;

  const painSeverity = tagScores.find((ts) => ts.tag === "pain_severity");
  const fearAvoidance = tagScores.find((ts) => ts.tag === "fear_avoidance");
  const functionalImpact = tagScores.find((ts) => ts.tag === "functional_impact");
  const chronicity = tagScores.find((ts) => ts.tag === "chronicity");

  if (fearAvoidance && fearAvoidance.percentage > 70) {
    return "High Fear-Avoidance";
  }
  if (chronicity && chronicity.percentage > 60) {
    return "Chronic Pain Pattern";
  }
  if (painSeverity && painSeverity.percentage > 70) {
    return "High Pain Severity";
  }
  if (functionalImpact && functionalImpact.percentage > 50) {
    return "Functional Limitation";
  }
  if (painSeverity && painSeverity.percentage < 30) {
    return "Low Risk";
  }

  const highestTag = tagScores.reduce((prev, curr) =>
    curr.percentage > prev.percentage ? curr : prev
  );

  return `Elevated ${highestTag.tag.replace(/_/g, " ")}`;
}

export async function scoreAssessmentResponse(
  assessmentId: string,
  answers: Record<string, unknown>
): Promise<ScoringResult> {
  // Note: assessment fetching logic here is simplified as scoring service 
  // should ideally be decoupled from storage, but we implement it to match current route usage.
  const { storage } = await import("../../storage");
  const assessment = await storage.getAssessmentById(assessmentId);

  if (!assessment) {
    throw new Error("Assessment not found");
  }

  const scoringConfig = assessment.scoringConfig as ScoringConfig | null;
  const surveyJson = assessment.surveyJson as SurveyJson | null;
  const questionMetadata = extractQuestionMetadata(surveyJson);
  const tagScores = calculateTagScores(answers, scoringConfig, questionMetadata);

  // For outcome rules, we'll need to check if they exist in the scoring config or separate field
  // Assuming they are part of scoring config for now or use default inference
  const primaryOutcome = determinePrimaryOutcome(tagScores, null);

  return {
    tagScores,
    primaryOutcome,
    recommendations: [], // To be implemented with recommendation engine
  };
}
