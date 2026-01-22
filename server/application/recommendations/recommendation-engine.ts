/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import type { ContentItem as SchemaContentItem } from "@shared/schema";
import type { TagScore } from "../../domain/scoring";
import {
  type RecommendationContext,
  type FullRecommendationResult,
  type RecommendationResult,
  type RuleConfig,
  type ContentItem,
  buildFallbackResult,
  buildPathwayResult,
  buildResultFromConfig,
  getTopTags,
  isConfigApplicable,
  isContentRelevantToPathway,
  matchContentToTags,
  sortRecommendations,
} from "../../domain/recommendations";

export async function generateRecommendationResults(
  ctx: AppContext,
  context: RecommendationContext
): Promise<FullRecommendationResult> {
  const { tagScores, rawAnswers, assessmentId, pathwayId, currentPathwayWeek } = context;

  const scoreMap: Record<string, number> = {};
  for (const ts of tagScores) {
    scoreMap[ts.tag] = ts.percentage;
  }

  const allContent = await ctx.storage.getAllContent();
  const contentMap = new Map(allContent.map((c) => [c.id, c]));

  const results: RecommendationResult[] = [];
  const matchedRuleIds: string[] = [];
  const contentRationale: Record<string, string> = {};
  const usedContentIds = new Set<string>();

  const tier1Results = await getTier1Recommendations(
    ctx,
    scoreMap,
    rawAnswers || {},
    assessmentId,
    pathwayId,
    currentPathwayWeek,
    contentMap
  );
  for (const r of tier1Results) {
    if (!usedContentIds.has(r.contentId)) {
      usedContentIds.add(r.contentId);
      results.push(r);
      if (r.ruleId) matchedRuleIds.push(r.ruleId);
      if (r.rationale) contentRationale[r.contentId] = r.rationale;
    }
  }

  if (pathwayId && currentPathwayWeek !== undefined) {
    const tier2Results = await getTier2PathwayRecommendations(
      ctx,
      pathwayId,
      currentPathwayWeek,
      tagScores,
      usedContentIds,
      contentMap
    );
    for (const r of tier2Results) {
      if (!usedContentIds.has(r.contentId)) {
        usedContentIds.add(r.contentId);
        results.push(r);
        if (r.rationale) contentRationale[r.contentId] = r.rationale;
      }
    }
  }

  if (results.length < 3) {
    const tier3Results = await getTier3FallbackRecommendations(
      tagScores,
      usedContentIds,
      contentMap
    );
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

export async function getRecommendationsWithFallback(
  ctx: AppContext,
  tagScores: TagScore[],
  assessmentId?: string,
  pathwayId?: string,
  pathwayWeek?: number
): Promise<RecommendationResult[]> {
  const result = await generateRecommendationResults(ctx, {
    tagScores,
    assessmentId,
    pathwayId,
    currentPathwayWeek: pathwayWeek,
  });
  return result.recommendations;
}

export async function previewRecommendationResults(
  ctx: AppContext,
  tagScores: TagScore[],
  assessmentId?: string,
  pathwayId?: string,
  pathwayWeek?: number
): Promise<FullRecommendationResult> {
  return generateRecommendationResults(ctx, {
    tagScores,
    assessmentId,
    pathwayId,
    currentPathwayWeek: pathwayWeek,
  });
}

async function getTier1Recommendations(
  ctx: AppContext,
  scoreMap: Record<string, number>,
  rawAnswers: Record<string, unknown>,
  assessmentId?: string,
  pathwayId?: string,
  pathwayWeek?: number,
  contentMap?: Map<string, SchemaContentItem>
): Promise<RecommendationResult[]> {
  const configs = await ctx.storage.getRecommendationConfigs({ isActive: true });

  const applicableConfigs = configs.filter((config) => {
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
  ctx: AppContext,
  pathwayId: string,
  currentWeek: number,
  tagScores: TagScore[],
  usedContentIds: Set<string>,
  contentMap: Map<string, SchemaContentItem>
): Promise<RecommendationResult[]> {
  const milestones = await ctx.storage.getMilestonesByPathwayId(pathwayId);

  const relevantMilestones = milestones.filter(
    (m) => m.weekNumber >= currentWeek && m.weekNumber <= currentWeek + 2
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
