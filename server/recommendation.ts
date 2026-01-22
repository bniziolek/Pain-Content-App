import { storage } from "./storage";
import type { ContentItem as SchemaContentItem, ContentRecommendation, RecommendationConfig, PatientRecommendation } from "@shared/schema";
import type { TagScore } from "./scoring";
import {
  RecommendationResult,
  RecommendationContext,
  FullRecommendationResult,
  RuleConfig,
  ContentItem,
  isConfigApplicable,
  buildResultFromConfig,
  buildPathwayResult,
  buildFallbackResult,
  sortRecommendations,
  matchContentToTags,
  isContentRelevantToPathway,
  getTopTags,
} from "./domain/recommendations";

export type { RecommendationResult, RecommendationContext, FullRecommendationResult } from "./domain/recommendations";

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

  const sortedResults = sortRecommendations(results);

  return {
    recommendations: sortedResults.slice(0, 10),
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
  contentMap?: Map<string, SchemaContentItem>
): Promise<RecommendationResult[]> {
  const configs = await storage.getRecommendationConfigs({ isActive: true });
  
  const applicableConfigs = configs.filter(config => {
    return isConfigApplicable(
      config as RuleConfig,
      scoreMap,
      rawAnswers,
      assessmentId,
      pathwayId,
      pathwayWeek
    );
  });

  const results: RecommendationResult[] = [];
  
  for (const config of applicableConfigs) {
    const contentIds = config.contentIds ?? [];
    for (const contentId of contentIds) {
      const content = contentMap?.get(contentId);
      if (!content) continue;
      
      results.push(buildResultFromConfig(config as RuleConfig, content as ContentItem, scoreMap));
    }
  }

  return results;
}

async function getTier2PathwayRecommendations(
  pathwayId: string,
  currentWeek: number,
  tagScores: TagScore[],
  usedContentIds: Set<string>,
  contentMap: Map<string, SchemaContentItem>
): Promise<RecommendationResult[]> {
  const milestones = await storage.getMilestonesByPathwayId(pathwayId);
  
  const relevantMilestones = milestones.filter(m => 
    m.weekNumber >= currentWeek && m.weekNumber <= currentWeek + 2
  );

  const results: RecommendationResult[] = [];
  const topTags = getTopTags(tagScores, 3);

  for (const milestone of relevantMilestones) {
    const contentIds = milestone.contentIds ?? [];
    for (const contentId of contentIds) {
      if (usedContentIds.has(contentId)) continue;
      
      const content = contentMap.get(contentId);
      if (!content) continue;
      
      if (isContentRelevantToPathway(content as ContentItem, topTags) || milestone.weekNumber === currentWeek) {
        results.push(buildPathwayResult(content as ContentItem, milestone, currentWeek));
      }
    }
  }

  return results;
}

async function getTier3FallbackRecommendations(
  tagScores: TagScore[],
  usedContentIds: Set<string>,
  contentMap: Map<string, SchemaContentItem>
): Promise<RecommendationResult[]> {
  const scoredContent: Array<{ content: SchemaContentItem; matchedTag: string; score: number }> = [];

  const contentArray = Array.from(contentMap.values());
  for (const content of contentArray) {
    if (usedContentIds.has(content.id)) continue;

    const match = matchContentToTags(content as ContentItem, tagScores);
    if (match.matched) {
      scoredContent.push({ content, matchedTag: match.tag, score: match.score });
    }
  }

  scoredContent.sort((a, b) => b.score - a.score);

  return scoredContent.slice(0, 5).map((sc) => 
    buildFallbackResult(sc.content as ContentItem, sc.matchedTag, sc.score)
  );
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
