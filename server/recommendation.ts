import { storage } from "./storage";
import type { ContentItem, ContentRecommendation } from "@shared/schema";
import type { TagScore } from "./scoring";

export interface RecommendationResult {
  contentId: string;
  contentTitle: string;
  contentSummary: string;
  tag: string;
  priority: number;
  rationale: string | null;
  matchScore: number;
}

export async function getRecommendationsForTagScores(
  tagScores: TagScore[]
): Promise<RecommendationResult[]> {
  const scoreMap: Record<string, number> = {};
  for (const ts of tagScores) {
    scoreMap[ts.tag] = ts.percentage;
  }

  const rules = await storage.getRecommendationsForScores(scoreMap);
  const content = await storage.getAllContent();
  const contentMap = new Map(content.map((c) => [c.id, c]));

  const results: RecommendationResult[] = [];

  for (const rule of rules) {
    const contentItem = contentMap.get(rule.contentId);
    if (!contentItem) continue;

    const tagScore = scoreMap[rule.tag] ?? 0;
    const isInRange = tagScore >= (rule.minScore ?? 0) && tagScore <= (rule.maxScore ?? 100);

    if (isInRange) {
      const matchScore = calculateMatchScore(tagScore, rule.minScore ?? 0, rule.maxScore ?? 100);

      results.push({
        contentId: rule.contentId,
        contentTitle: contentItem.title,
        contentSummary: contentItem.summary,
        tag: rule.tag,
        priority: rule.priority ?? 1,
        rationale: rule.rationale,
        matchScore,
      });
    }
  }

  results.sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    return b.matchScore - a.matchScore;
  });

  const seenContentIds = new Set<string>();
  const deduped: RecommendationResult[] = [];
  for (const r of results) {
    if (!seenContentIds.has(r.contentId)) {
      seenContentIds.add(r.contentId);
      deduped.push(r);
    }
  }

  return deduped;
}

function calculateMatchScore(score: number, min: number, max: number): number {
  const midpoint = (min + max) / 2;
  const distance = Math.abs(score - midpoint);
  const maxDistance = (max - min) / 2;
  return maxDistance > 0 ? 1 - distance / maxDistance : 1;
}

export async function getRecommendationsWithFallback(
  tagScores: TagScore[]
): Promise<RecommendationResult[]> {
  const rulesBasedRecs = await getRecommendationsForTagScores(tagScores);

  if (rulesBasedRecs.length >= 3) {
    return rulesBasedRecs.slice(0, 10);
  }

  const fallbackRecs = await getTagBasedFallbackRecommendations(tagScores, rulesBasedRecs);
  const combined = [...rulesBasedRecs, ...fallbackRecs];

  const seenIds = new Set<string>();
  const unique: RecommendationResult[] = [];
  for (const rec of combined) {
    if (!seenIds.has(rec.contentId)) {
      seenIds.add(rec.contentId);
      unique.push(rec);
    }
  }

  return unique.slice(0, 10);
}

async function getTagBasedFallbackRecommendations(
  tagScores: TagScore[],
  existingRecs: RecommendationResult[]
): Promise<RecommendationResult[]> {
  const existingContentIds = new Set(existingRecs.map((r) => r.contentId));
  const allContent = await storage.getAllContent();

  const scoredContent: Array<{ content: ContentItem; score: number; matchedTag: string }> = [];

  const sortedTags = [...tagScores].sort((a, b) => b.percentage - a.percentage);

  for (const content of allContent) {
    if (existingContentIds.has(content.id)) continue;

    for (const tagScore of sortedTags) {
      if (tagScore.percentage < 30) continue;

      const tagWords = tagScore.tag.toLowerCase().split("_");
      const contentTags = content.tags?.map((t) => t.toLowerCase()) ?? [];

      const hasMatch = tagWords.some((word) =>
        contentTags.some((ct) => ct.includes(word) || word.includes(ct))
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
  }));
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
