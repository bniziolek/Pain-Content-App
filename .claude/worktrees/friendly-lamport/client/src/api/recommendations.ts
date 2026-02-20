import { fetchAPI, jsonHeaders } from "./base";
import type { ContentItem, ContentRecommendation } from "@shared/api-types";

// Recommendations
export async function getRecommendations(tagScores: any[], assessmentId?: string, pathwayId?: string, pathwayWeek?: number): Promise<ContentItem[]> {
  return fetchAPI("/recommendations", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ tagScores, assessmentId, pathwayId, pathwayWeek }),
  });
}

export async function previewRecommendations(tagScores: any[], assessmentId?: string, pathwayId?: string, pathwayWeek?: number): Promise<any> {
  return fetchAPI("/recommendations/preview", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ tagScores, assessmentId, pathwayId, pathwayWeek }),
  });
}

// Recommendation Rules
export interface RecommendationRule {
  id: string;
  clinicianUserId: string;
  tag: string;
  minScore: number;
  maxScore: number;
  priority: number;
  contentId: string;
  rationale: string | null;
  createdAt: string;
}

export async function getRecommendationRules(): Promise<RecommendationRule[]> {
  return fetchAPI("/recommendations/rules");
}

export async function createRecommendationRule(rule: {
  tag: string;
  minScore: number;
  maxScore: number;
  contentId: string;
  priority?: number;
  rationale?: string;
}): Promise<RecommendationRule> {
  return fetchAPI("/recommendations/rules", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(rule),
  });
}

export async function deleteRecommendationRule(id: string): Promise<void> {
  await fetchAPI(`/recommendations/rules/${id}`, { method: "DELETE" });
}

// Recommendation Configs
export interface RecommendationConfig {
  id: string;
  clinicianUserId: string;
  name: string;
  assessmentId: string | null;
  pathwayId: string | null;
  pathwayWeek: number | null;
  tag: string;
  minScore: number;
  maxScore: number;
  priority: number;
  contentIds: string[];
  rationale: string | null;
  questionName: string | null;
  questionType: string | null;
  matchOperator: string;
  matchValues: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getRecommendationConfigs(assessmentId?: string, pathwayId?: string): Promise<RecommendationConfig[]> {
  const params = new URLSearchParams();
  if (assessmentId) params.set("assessmentId", assessmentId);
  if (pathwayId) params.set("pathwayId", pathwayId);
  return fetchAPI(`/recommendations/configs?${params.toString()}`);
}

export async function createRecommendationConfig(config: {
  name: string;
  assessmentId?: string;
  pathwayId?: string;
  pathwayWeek?: number;
  tag?: string;
  minScore?: number;
  maxScore?: number;
  priority?: number;
  contentIds: string[];
  rationale?: string;
  questionName?: string;
  questionType?: string;
  matchOperator?: string;
  matchValues?: any;
}): Promise<RecommendationConfig> {
  return fetchAPI("/recommendations/configs", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(config),
  });
}

export async function updateRecommendationConfig(id: string, updates: Partial<RecommendationConfig>): Promise<RecommendationConfig> {
  return fetchAPI(`/recommendations/configs/${id}`, {
    method: "PUT",
    headers: jsonHeaders(),
    body: JSON.stringify(updates),
  });
}

export async function deleteRecommendationConfig(id: string): Promise<void> {
  await fetchAPI(`/recommendations/configs/${id}`, { method: "DELETE" });
}

// Content Recommendations (legacy)
export async function getContentRecommendations(): Promise<ContentRecommendation[]> {
  return fetchAPI("/content-recommendations");
}

export async function getRecommendationsForScores(tagScores: Record<string, number>): Promise<(ContentRecommendation & { content: ContentItem })[]> {
  return fetchAPI("/recommendations/for-scores", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ tagScores }),
  });
}
