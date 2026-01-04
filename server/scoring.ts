import { storage } from "./storage";
import type { Assessment, AssessmentResponse } from "@shared/schema";

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

export async function scoreAssessmentResponse(
  assessmentId: string,
  answers: Record<string, unknown>
): Promise<ScoringResult> {
  const assessment = await storage.getAssessmentById(assessmentId);
  if (!assessment) {
    throw new Error("Assessment not found");
  }

  const scoringConfig = assessment.scoringConfig as ScoringConfig | null;
  const outcomeRules = assessment.outcomeRules as OutcomeRules | null;

  const tagScores = calculateTagScores(answers, scoringConfig);
  const primaryOutcome = determinePrimaryOutcome(tagScores, outcomeRules);
  const recommendations = await generateRecommendations(tagScores);

  return {
    tagScores,
    primaryOutcome,
    recommendations,
  };
}

function calculateTagScores(
  answers: Record<string, unknown>,
  scoringConfig: ScoringConfig | null
): TagScore[] {
  if (!scoringConfig || !scoringConfig.tags) {
    return inferTagScoresFromAnswers(answers);
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

function inferTagScoresFromAnswers(answers: Record<string, unknown>): TagScore[] {
  const inferredScores: Record<string, { total: number; count: number; max: number }> = {};
  
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
    const tag = tagMapping[questionName] || "general";
    
    if (!inferredScores[tag]) {
      inferredScores[tag] = { total: 0, count: 0, max: 0 };
    }

    if (typeof answer === "number") {
      inferredScores[tag].total += answer;
      inferredScores[tag].count += 1;
      inferredScores[tag].max += 10;
    } else if (typeof answer === "boolean") {
      inferredScores[tag].total += answer ? 1 : 0;
      inferredScores[tag].count += 1;
      inferredScores[tag].max += 1;
    } else if (Array.isArray(answer)) {
      inferredScores[tag].total += answer.length;
      inferredScores[tag].count += 1;
      inferredScores[tag].max += 10;
    } else if (typeof answer === "object" && answer !== null) {
      const values = Object.values(answer as Record<string, unknown>);
      for (const val of values) {
        if (typeof val === "number") {
          inferredScores[tag].total += val;
          inferredScores[tag].max += 3;
        }
      }
      inferredScores[tag].count += values.length;
    }
  }

  return Object.entries(inferredScores).map(([tag, data]) => ({
    tag,
    score: Math.round(data.total * 100) / 100,
    maxScore: data.max,
    percentage: data.max > 0 ? Math.round((data.total / data.max) * 100) : 0,
  }));
}

function determinePrimaryOutcome(
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

async function generateRecommendations(tagScores: TagScore[]): Promise<string[]> {
  const recommendations: string[] = [];

  for (const tagScore of tagScores) {
    if (tagScore.percentage > 60) {
      const contents = await storage.getAllContent();
      const relevantContent = contents.filter(
        (c) => c.tags?.includes(tagScore.tag) || 
               c.tags?.some((t) => t.toLowerCase().includes(tagScore.tag.split("_")[0]))
      );
      
      recommendations.push(...relevantContent.slice(0, 2).map((c) => c.id));
    }
  }

  return Array.from(new Set(recommendations));
}

export async function processAndStoreScores(
  responseId: string,
  assessmentId: string,
  answers: Record<string, unknown>
): Promise<ScoringResult> {
  const result = await scoreAssessmentResponse(assessmentId, answers);

  return result;
}
