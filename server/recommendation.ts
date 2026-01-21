import { storage } from "./storage";
import type { ContentItem, ContentRecommendation, RecommendationConfig, PatientRecommendation } from "@shared/schema";
import type { TagScore } from "./scoring";

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
  rawAnswers?: Record<string, unknown>; // actual answer values for answer-based matching
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

export async function generateRecommendations(
  context: RecommendationContext
): Promise<FullRecommendationResult> {
  const { tagScores, rawAnswers, assessmentId, pathwayId, currentPathwayWeek } = context;
  
  const scoreMap: Record<string, number> = {};
  for (const ts of tagScores) {
    scoreMap[ts.tag] = ts.percentage;
  }

  const allContent = await storage.getAllContent();
  const contentMap = new Map(allContent.map((c) => [c.id, c]));
  
  const results: RecommendationResult[] = [];
  const matchedRuleIds: string[] = [];
  const contentRationale: Record<string, string> = {};
  const usedContentIds = new Set<string>();

  const tier1Results = await getTier1Recommendations(scoreMap, rawAnswers || {}, assessmentId, pathwayId, currentPathwayWeek, contentMap);
  for (const r of tier1Results) {
    if (!usedContentIds.has(r.contentId)) {
      usedContentIds.add(r.contentId);
      results.push(r);
      if (r.ruleId) matchedRuleIds.push(r.ruleId);
      if (r.rationale) contentRationale[r.contentId] = r.rationale;
    }
  }

  if (pathwayId && currentPathwayWeek !== undefined) {
    const tier2Results = await getTier2PathwayRecommendations(pathwayId, currentPathwayWeek, tagScores, usedContentIds, contentMap);
    for (const r of tier2Results) {
      if (!usedContentIds.has(r.contentId)) {
        usedContentIds.add(r.contentId);
        results.push(r);
        if (r.rationale) contentRationale[r.contentId] = r.rationale;
      }
    }
  }

  if (results.length < 3) {
    const tier3Results = await getTier3FallbackRecommendations(tagScores, usedContentIds, contentMap);
    for (const r of tier3Results) {
      if (!usedContentIds.has(r.contentId)) {
        usedContentIds.add(r.contentId);
        results.push(r);
        if (r.rationale) contentRationale[r.contentId] = r.rationale;
      }
    }
  }

  results.sort((a, b) => {
    const sourceOrder = { rule: 0, pathway: 1, fallback: 2 };
    if (sourceOrder[a.source] !== sourceOrder[b.source]) {
      return sourceOrder[a.source] - sourceOrder[b.source];
    }
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    return b.matchScore - a.matchScore;
  });

  return {
    recommendations: results.slice(0, 10),
    matchedRuleIds,
    contentRationale,
  };
}

async function getTier1Recommendations(
  scoreMap: Record<string, number>,
  rawAnswers: Record<string, unknown>,
  assessmentId?: string,
  pathwayId?: string,
  pathwayWeek?: number,
  contentMap?: Map<string, ContentItem>
): Promise<RecommendationResult[]> {
  const configs = await storage.getRecommendationConfigs({ isActive: true });
  
  const applicableConfigs = configs.filter(config => {
    // Filter by assessment/pathway scope
    if (config.assessmentId && config.assessmentId !== assessmentId) return false;
    if (config.pathwayId && config.pathwayId !== pathwayId) return false;
    if (config.pathwayWeek !== null && config.pathwayWeek !== pathwayWeek) return false;
    
    // Check answer-based triggers first (new approach)
    if (config.questionName && config.matchValues !== null && config.matchValues !== undefined) {
      // Skip rules with no valid match values configured
      const hasValidMatchValues = Array.isArray(config.matchValues) 
        ? config.matchValues.length > 0 
        : (typeof config.matchValues === 'object' && Object.keys(config.matchValues as object).length > 0);
      
      if (!hasValidMatchValues) return false;
      return evaluateAnswerTrigger(rawAnswers, config);
    }
    
    // Fall back to legacy tag/percentage matching ONLY if no questionName is set
    // This prevents questionName-based rules from incorrectly matching via legacy path
    if (config.tag && !config.questionName) {
      const tagScore = scoreMap[config.tag] ?? 0;
      const minScore = config.minScore ?? 0;
      const maxScore = config.maxScore ?? 100;
      return tagScore >= minScore && tagScore <= maxScore;
    }
    
    return false;
  });

  const results: RecommendationResult[] = [];
  
  for (const config of applicableConfigs) {
    const contentIds = config.contentIds ?? [];
    for (const contentId of contentIds) {
      const content = contentMap?.get(contentId);
      if (!content) continue;
      
      const tagScore = scoreMap[config.tag || config.questionName || ''] ?? 0;
      const matchScore = config.questionName 
        ? 1.0 // Answer-based rules get full match score
        : calculateMatchScore(tagScore, config.minScore ?? 0, config.maxScore ?? 100);
      
      results.push({
        contentId,
        contentTitle: content.title,
        contentSummary: content.summary,
        tag: config.questionName || config.tag || '',
        priority: config.priority ?? 1,
        rationale: config.rationale,
        matchScore,
        source: 'rule',
        ruleId: config.id,
      });
    }
  }

  return results;
}

// Evaluate if an answer matches the configured trigger
function evaluateAnswerTrigger(
  rawAnswers: Record<string, unknown>,
  config: { questionName: string | null; matchOperator: string | null; matchValues: unknown }
): boolean {
  if (!config.questionName) return false;
  
  const answer = rawAnswers[config.questionName];
  if (answer === undefined) return false;
  
  const operator = config.matchOperator || 'equals';
  const matchValues = config.matchValues as unknown;
  
  switch (operator) {
    case 'equals':
      // matchValues should be a single value or array with one value
      if (Array.isArray(matchValues)) {
        return matchValues.length > 0 && matchValues[0] === answer;
      }
      return matchValues === answer;
      
    case 'in':
      // matchValues should be an array of acceptable values
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

async function getTier2PathwayRecommendations(
  pathwayId: string,
  currentWeek: number,
  tagScores: TagScore[],
  usedContentIds: Set<string>,
  contentMap: Map<string, ContentItem>
): Promise<RecommendationResult[]> {
  const milestones = await storage.getMilestonesByPathwayId(pathwayId);
  
  const relevantMilestones = milestones.filter(m => 
    m.weekNumber >= currentWeek && m.weekNumber <= currentWeek + 2
  );

  const results: RecommendationResult[] = [];
  const sortedTags = [...tagScores].sort((a, b) => b.percentage - a.percentage);
  const topTags = sortedTags.slice(0, 3).map(t => t.tag.toLowerCase());

  for (const milestone of relevantMilestones) {
    const contentIds = milestone.contentIds ?? [];
    for (const contentId of contentIds) {
      if (usedContentIds.has(contentId)) continue;
      
      const content = contentMap.get(contentId);
      if (!content) continue;
      
      const contentTags = content.tags?.map(t => t.toLowerCase()) ?? [];
      const hasRelevantTag = topTags.some(tag => 
        contentTags.some(ct => ct.includes(tag) || tag.includes(ct))
      );
      
      if (hasRelevantTag || milestone.weekNumber === currentWeek) {
        const weekDiff = Math.abs(milestone.weekNumber - currentWeek);
        const priority = 10 + weekDiff;
        
        results.push({
          contentId,
          contentTitle: content.title,
          contentSummary: content.summary,
          tag: 'pathway',
          priority,
          rationale: `Week ${milestone.weekNumber} milestone: ${milestone.title}`,
          matchScore: 1 - (weekDiff * 0.2),
          source: 'pathway',
        });
      }
    }
  }

  return results;
}

async function getTier3FallbackRecommendations(
  tagScores: TagScore[],
  usedContentIds: Set<string>,
  contentMap: Map<string, ContentItem>
): Promise<RecommendationResult[]> {
  const sortedTags = [...tagScores].sort((a, b) => b.percentage - a.percentage);
  const scoredContent: Array<{ content: ContentItem; score: number; matchedTag: string }> = [];

  const contentArray = Array.from(contentMap.values());
  for (const content of contentArray) {
    if (usedContentIds.has(content.id)) continue;

    for (const tagScore of sortedTags) {
      if (tagScore.percentage < 30) continue;

      const tagWords = tagScore.tag.toLowerCase().split("_");
      const contentTags: string[] = content.tags?.map((t: string) => t.toLowerCase()) ?? [];

      const hasMatch = tagWords.some((word) =>
        contentTags.some((ct: string) => ct.includes(word) || word.includes(ct))
      );

      if (hasMatch) {
        scoredContent.push({
          content,
          score: tagScore.percentage,
          matchedTag: tagScore.tag,
        });
        break;
      }
    }
  }

  scoredContent.sort((a, b) => b.score - a.score);

  return scoredContent.slice(0, 5).map((sc) => ({
    contentId: sc.content.id,
    contentTitle: sc.content.title,
    contentSummary: sc.content.summary,
    tag: sc.matchedTag,
    priority: 99,
    rationale: `Matched based on elevated ${sc.matchedTag.replace(/_/g, " ")} score`,
    matchScore: sc.score / 100,
    source: 'fallback' as const,
  }));
}

function calculateMatchScore(score: number, min: number, max: number): number {
  const midpoint = (min + max) / 2;
  const distance = Math.abs(score - midpoint);
  const maxDistance = (max - min) / 2;
  return maxDistance > 0 ? 1 - distance / maxDistance : 1;
}

export async function savePatientRecommendation(
  context: RecommendationContext,
  result: FullRecommendationResult
): Promise<PatientRecommendation> {
  if (!context.patientEmail || !context.clinicianUserId) {
    throw new Error("patientEmail and clinicianUserId are required to save recommendations");
  }

  return storage.createPatientRecommendation({
    patientEmail: context.patientEmail,
    clinicianUserId: context.clinicianUserId,
    source: context.assessmentId ? 'assessment' : (context.pathwayId ? 'pathway_milestone' : 'manual'),
    sourceId: context.assessmentId,
    assessmentId: context.assessmentId,
    pathwayId: context.pathwayId,
    pathwayWeek: context.currentPathwayWeek,
    tagScores: context.tagScores,
    matchedRuleIds: result.matchedRuleIds,
    recommendedContentIds: result.recommendations.map(r => r.contentId),
    contentRationale: result.contentRationale,
  });
}

export async function getRecommendationsForTagScores(
  tagScores: TagScore[]
): Promise<RecommendationResult[]> {
  const result = await generateRecommendations({ tagScores });
  return result.recommendations;
}

export async function getRecommendationsWithFallback(
  tagScores: TagScore[]
): Promise<RecommendationResult[]> {
  return getRecommendationsForTagScores(tagScores);
}

export async function createRecommendationRule(
  tag: string,
  minScore: number,
  maxScore: number,
  contentId: string,
  priority: number = 1,
  rationale?: string
): Promise<ContentRecommendation> {
  return storage.createContentRecommendation({
    tag,
    minScore,
    maxScore,
    contentId,
    priority,
    rationale: rationale ?? null,
  });
}

export async function getRecommendationRules(): Promise<ContentRecommendation[]> {
  return storage.getContentRecommendations();
}

export async function deleteRecommendationRule(id: string): Promise<void> {
  return storage.deleteContentRecommendation(id);
}

export async function createRecommendationConfig(config: {
  clinicianUserId?: string;
  name: string;
  assessmentId?: string;
  pathwayId?: string;
  pathwayWeek?: number;
  tag: string;
  minScore?: number;
  maxScore?: number;
  priority?: number;
  contentIds: string[];
  rationale?: string;
  questionName?: string;
  questionType?: string;
  matchOperator?: string;
  matchValues?: unknown;
}) {
  return storage.createRecommendationConfig({
    clinicianUserId: config.clinicianUserId ?? null,
    name: config.name,
    assessmentId: config.assessmentId ?? null,
    pathwayId: config.pathwayId ?? null,
    pathwayWeek: config.pathwayWeek ?? null,
    tag: config.tag,
    minScore: config.minScore ?? 0,
    maxScore: config.maxScore ?? 100,
    priority: config.priority ?? 1,
    contentIds: config.contentIds,
    rationale: config.rationale ?? null,
    questionName: config.questionName ?? null,
    questionType: config.questionType ?? null,
    matchOperator: config.matchOperator ?? 'equals',
    matchValues: config.matchValues ?? null,
  });
}

export async function getRecommendationConfigs(filters?: {
  clinicianId?: string;
  assessmentId?: string;
  pathwayId?: string;
}) {
  return storage.getRecommendationConfigs(filters);
}

export async function updateRecommendationConfig(id: string, updates: {
  name?: string;
  tag?: string;
  minScore?: number;
  maxScore?: number;
  priority?: number;
  contentIds?: string[];
  rationale?: string;
  isActive?: boolean;
}) {
  return storage.updateRecommendationConfig(id, updates);
}

export async function deleteRecommendationConfig(id: string) {
  return storage.deleteRecommendationConfig(id);
}

export async function previewRecommendations(
  tagScores: TagScore[],
  assessmentId?: string,
  pathwayId?: string,
  pathwayWeek?: number
): Promise<FullRecommendationResult> {
  return generateRecommendations({
    tagScores,
    assessmentId,
    pathwayId,
    currentPathwayWeek: pathwayWeek,
  });
}
