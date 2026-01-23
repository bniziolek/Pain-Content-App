import type { TagScore } from "../scoring";

export interface RecommendationResult {
  contentId: string;
  contentTitle: string;
  contentSummary: string;
  tag: string;
  priority: number;
  rationale: string | null;
  matchScore: number;
  source: 'rule' | 'pathway' | 'fallback';
  ruleId?: string;
}

export interface RecommendationContext {
  tagScores: TagScore[];
  rawAnswers?: Record<string, unknown>;
  assessmentId?: string;
  pathwayId?: string;
  currentPathwayWeek?: number;
  patientEmail?: string;
  clinicianUserId?: string;
}

export interface FullRecommendationResult {
  recommendations: RecommendationResult[];
  matchedRuleIds: string[];
  contentRationale: Record<string, string>;
}

export interface AnswerTriggerConfig {
  questionName: string | null;
  matchOperator: string | null;
  matchValues: unknown;
}

export interface RuleConfig {
  id: string;
  tag: string | null;
  questionName: string | null;
  matchOperator: string | null;
  matchValues: unknown;
  minScore: number | null;
  maxScore: number | null;
  priority: number | null;
  contentIds: string[] | null;
  rationale: string | null;
  assessmentId: string | null;
  pathwayId: string | null;
  pathwayWeek: number | null;
}

export interface ContentItem {
  id: string;
  title: string;
  summary: string;
  tags?: string[];
}

export interface MilestoneItem {
  weekNumber: number;
  title: string;
  contentIds: string[] | null;
}

export function evaluateAnswerTrigger(
  rawAnswers: Record<string, unknown>,
  config: AnswerTriggerConfig
): boolean {
  if (!config.questionName) return false;
  
  const answer = rawAnswers[config.questionName];
  if (answer === undefined) return false;
  
  const operator = config.matchOperator || 'equals';
  const matchValues = config.matchValues as unknown;
  
  switch (operator) {
    case 'equals':
      if (Array.isArray(matchValues)) {
        return matchValues.length > 0 && matchValues[0] === answer;
      }
      return matchValues === answer;
      
    case 'in':
      if (Array.isArray(matchValues)) {
        return matchValues.includes(answer);
      }
      return false;
      
    case 'not_equals':
      if (Array.isArray(matchValues)) {
        return matchValues.length === 0 || matchValues[0] !== answer;
      }
      return matchValues !== answer;
      
    case 'greater_than':
      if (typeof answer === 'number' && typeof matchValues === 'number') {
        return answer > matchValues;
      }
      if (typeof answer === 'number' && typeof matchValues === 'object' && matchValues !== null) {
        const threshold = (matchValues as { value?: number }).value;
        return typeof threshold === 'number' && answer > threshold;
      }
      return false;
      
    case 'less_than':
      if (typeof answer === 'number' && typeof matchValues === 'number') {
        return answer < matchValues;
      }
      if (typeof answer === 'number' && typeof matchValues === 'object' && matchValues !== null) {
        const threshold = (matchValues as { value?: number }).value;
        return typeof threshold === 'number' && answer < threshold;
      }
      return false;
      
    case 'between':
      if (typeof answer === 'number' && typeof matchValues === 'object' && matchValues !== null) {
        const { min, max } = matchValues as { min?: number; max?: number };
        return typeof min === 'number' && typeof max === 'number' && answer >= min && answer <= max;
      }
      return false;
      
    default:
      return false;
  }
}

export function calculateMatchScore(score: number, min: number, max: number): number {
  const midpoint = (min + max) / 2;
  const distance = Math.abs(score - midpoint);
  const maxDistance = (max - min) / 2;
  return maxDistance > 0 ? 1 - distance / maxDistance : 1;
}

export function isConfigApplicable(
  config: RuleConfig,
  scoreMap: Record<string, number>,
  rawAnswers: Record<string, unknown>,
  assessmentId?: string,
  pathwayId?: string,
  pathwayWeek?: number
): boolean {
  if (config.assessmentId && config.assessmentId !== assessmentId) return false;
  if (config.pathwayId && config.pathwayId !== pathwayId) return false;
  if (config.pathwayWeek !== null && config.pathwayWeek !== pathwayWeek) return false;
  
  if (config.questionName && config.matchValues !== null && config.matchValues !== undefined) {
    const hasValidMatchValues = Array.isArray(config.matchValues) 
      ? config.matchValues.length > 0 
      : (typeof config.matchValues === 'object' && Object.keys(config.matchValues as object).length > 0);
    
    if (!hasValidMatchValues) return false;
    return evaluateAnswerTrigger(rawAnswers, config);
  }
  
  if (config.tag && !config.questionName) {
    const tagScore = scoreMap[config.tag] ?? 0;
    const minScore = config.minScore ?? 0;
    const maxScore = config.maxScore ?? 100;
    return tagScore >= minScore && tagScore <= maxScore;
  }
  
  return false;
}

export function buildResultFromConfig(
  config: RuleConfig,
  content: ContentItem,
  scoreMap: Record<string, number>
): RecommendationResult {
  const tagScore = scoreMap[config.tag || config.questionName || ''] ?? 0;
  const matchScore = config.questionName 
    ? 1.0
    : calculateMatchScore(tagScore, config.minScore ?? 0, config.maxScore ?? 100);
  
  return {
    contentId: content.id,
    contentTitle: content.title,
    contentSummary: content.summary,
    tag: config.questionName || config.tag || '',
    priority: config.priority ?? 1,
    rationale: config.rationale,
    matchScore,
    source: 'rule',
    ruleId: config.id,
  };
}

export function buildPathwayResult(
  content: ContentItem,
  milestone: MilestoneItem,
  currentWeek: number
): RecommendationResult {
  const weekDiff = Math.abs(milestone.weekNumber - currentWeek);
  const priority = 10 + weekDiff;
  
  return {
    contentId: content.id,
    contentTitle: content.title,
    contentSummary: content.summary,
    tag: 'pathway',
    priority,
    rationale: `Week ${milestone.weekNumber} milestone: ${milestone.title}`,
    matchScore: 1 - (weekDiff * 0.2),
    source: 'pathway',
  };
}

export function buildFallbackResult(
  content: ContentItem,
  matchedTag: string,
  score: number
): RecommendationResult {
  return {
    contentId: content.id,
    contentTitle: content.title,
    contentSummary: content.summary,
    tag: matchedTag,
    priority: 99,
    rationale: `Matched based on elevated ${matchedTag.replace(/_/g, " ")} score`,
    matchScore: score / 100,
    source: 'fallback',
  };
}

export function sortRecommendations(results: RecommendationResult[]): RecommendationResult[] {
  return [...results].sort((a, b) => {
    const sourceOrder = { rule: 0, pathway: 1, fallback: 2 };
    if (sourceOrder[a.source] !== sourceOrder[b.source]) {
      return sourceOrder[a.source] - sourceOrder[b.source];
    }
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    return b.matchScore - a.matchScore;
  });
}

export function matchContentToTags(
  content: ContentItem,
  tagScores: TagScore[]
): { matched: boolean; tag: string; score: number } {
  const sortedTags = [...tagScores].sort((a, b) => b.percentage - a.percentage);
  
  for (const tagScore of sortedTags) {
    if (tagScore.percentage < 30) continue;

    const tagWords = tagScore.tag.toLowerCase().split("_");
    const contentTags: string[] = content.tags?.map((t: string) => t.toLowerCase()) ?? [];

    const hasMatch = tagWords.some((word) =>
      contentTags.some((ct: string) => ct.includes(word) || word.includes(ct))
    );

    if (hasMatch) {
      return { matched: true, tag: tagScore.tag, score: tagScore.percentage };
    }
  }
  
  return { matched: false, tag: '', score: 0 };
}

export function isContentRelevantToPathway(
  content: ContentItem,
  topTags: string[]
): boolean {
  const contentTags = content.tags?.map(t => t.toLowerCase()) ?? [];
  return topTags.some(tag => 
    contentTags.some(ct => ct.includes(tag) || tag.includes(ct))
  );
}

export function getTopTags(tagScores: TagScore[], count: number = 3): string[] {
  return [...tagScores]
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, count)
    .map(t => t.tag.toLowerCase());
}
