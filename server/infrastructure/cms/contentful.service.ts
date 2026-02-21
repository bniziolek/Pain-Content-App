/**
 * Architecture: Infrastructure layer. Wraps external services (email, Stripe, CMS, audit) behind stable interfaces.
 */

import { createClient, type Entry, type EntrySkeletonType, type Asset } from "contentful";
import type { ContentItem, CarePathway, PathwayMilestone } from "@shared/schema";

interface RichTextNode {
  nodeType: string;
  content?: RichTextNode[];
  value?: string;
  data?: Record<string, unknown>;
  marks?: { type: string }[];
}

interface ContentfulRichText {
  nodeType: string;
  data: Record<string, unknown>;
  content: RichTextNode[];
}

interface ContentfulFields {
  title: string;
  summary: string | ContentfulRichText;
  body: string | ContentfulRichText;
  tags?: string[];
  imageUrl?: Asset | string;
  readTime?: string;
}

interface ContentfulContentItem extends EntrySkeletonType {
  contentTypeId: "contentItem";
  fields: ContentfulFields;
}

const spaceId = process.env.CONTENTFUL_SPACE_ID;
const accessToken = process.env.CONTENTFUL_ACCESS_TOKEN;

if (!spaceId || !accessToken) {
  console.warn("Contentful credentials not configured. Content library will use database.");
}

const client = spaceId && accessToken
  ? createClient({
    space: spaceId,
    accessToken: accessToken,
  })
  : null;

const DEFAULT_CACHE_TTL_MS = 300000;
const rawCacheTtl = process.env.CONTENTFUL_CACHE_TTL_MS;
let cacheTtlMs: number = DEFAULT_CACHE_TTL_MS;

if (rawCacheTtl && rawCacheTtl.trim() !== "") {
  const parsedTtl = Number.parseInt(rawCacheTtl, 10);
  if (Number.isNaN(parsedTtl) || parsedTtl <= 0) {
    console.warn(
      `Invalid CONTENTFUL_CACHE_TTL_MS value "${rawCacheTtl}". Using default TTL of ${DEFAULT_CACHE_TTL_MS} ms.`
    );
  } else {
    cacheTtlMs = parsedTtl;
  }
}
const cache = new Map<string, { value: unknown; expiresAt: number }>();

function cleanupExpiredCache(): void {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (entry.expiresAt < now) {
      cache.delete(key);
    }
  }
}

setInterval(cleanupExpiredCache, cacheTtlMs);

function getCache<T>(key: string): T | undefined {
  if (!cacheTtlMs || cacheTtlMs <= 0) {
    return undefined;
  }
  const entry = cache.get(key);
  if (!entry) {
    return undefined;
  }
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return undefined;
  }
  return entry.value as T;
}

function setCache<T>(key: string, value: T): void {
  if (!cacheTtlMs || cacheTtlMs <= 0) {
    return;
  }
  cache.set(key, { value, expiresAt: Date.now() + cacheTtlMs });
}

export class ContentfulError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message);
    this.name = "ContentfulError";
  }
}

function extractTextFromRichText(richText: ContentfulRichText | string): string {
  if (typeof richText === "string") {
    return richText;
  }

  if (!richText || !richText.content) {
    return "";
  }

  function extractText(nodes: RichTextNode[]): string {
    return nodes.map(node => {
      if (node.nodeType === "text" && node.value) {
        return node.value;
      }
      if (node.content) {
        return extractText(node.content);
      }
      return "";
    }).join("");
  }

  return extractText(richText.content);
}

function extractImageUrl(imageField: Asset | string | undefined): string | null {
  if (!imageField) {
    return null;
  }

  if (typeof imageField === "string") {
    return imageField;
  }

  const asset = imageField as Asset;
  if (asset.fields?.file?.url) {
    const url = asset.fields.file.url as string;
    return url.startsWith("//") ? `https:${url}` : url;
  }

  return null;
}

function parseContentfulEntry(entry: Entry<ContentfulContentItem>): ContentItem {
  const fields = entry.fields as unknown as ContentfulFields;

  console.log("[Contentful] Parsing entry:", entry.sys.id, "Title:", fields.title);

  const summary = extractTextFromRichText(fields.summary);
  const body = extractTextFromRichText(fields.body);
  const imageUrl = extractImageUrl(fields.imageUrl);

  console.log("[Contentful] Extracted summary:", summary.substring(0, 50) + "...");
  console.log("[Contentful] Extracted imageUrl:", imageUrl);

  return {
    id: entry.sys.id,
    title: fields.title || "",
    summary,
    body,
    tags: fields.tags || [],
    imageUrl,
    readTime: fields.readTime || "5 min",
    createdAt: new Date(entry.sys.createdAt),
    updatedAt: new Date(entry.sys.updatedAt),
    submittedAt: new Date(entry.sys.createdAt), // Contentful content is considered submitted when created
    clinicianUserId: null, // System content has no clinician owner
    moderationStatus: 'approved', // Contentful content is pre-approved
    moderationNote: null,
  };
}

export async function getAllContentFromContentful(): Promise<ContentItem[]> {
  if (!client) {
    throw new ContentfulError("Contentful client not initialized");
  }

  const cached = getCache<ContentItem[]>("content:all");
  if (cached) {
    return cached;
  }

  console.log("[Contentful] Fetching all content items...");

  try {
    const entries = await client.getEntries<ContentfulContentItem>({
      content_type: "contentItem",
      order: ["-sys.createdAt"],
    });

    console.log(`[Contentful] Found ${entries.items.length} content items`);

    const parsed = entries.items.map(parseContentfulEntry);
    setCache("content:all", parsed);
    for (const item of parsed) {
      setCache(`content:id:${item.id}`, item);
    }

    return parsed;
  } catch (error) {
    console.error("[Contentful] Error fetching content:", error);
    throw new ContentfulError("Failed to fetch content from Contentful", error);
  }
}

export async function getContentByIdFromContentful(id: string): Promise<ContentItem | null> {
  if (!client) {
    throw new ContentfulError("Contentful client not initialized");
  }

  const cached = getCache<ContentItem>(`content:id:${id}`);
  if (cached) {
    return cached;
  }

  const listCached = getCache<ContentItem[]>("content:all");
  if (listCached) {
    const match = listCached.find(item => item.id === id) || null;
    if (match) {
      return match;
    }
  }

  console.log(`[Contentful] Fetching content by ID: ${id}`);

  try {
    const entry = await client.getEntry<ContentfulContentItem>(id);
    const parsed = parseContentfulEntry(entry);
    setCache(`content:id:${id}`, parsed);
    return parsed;
  } catch (error) {
    console.error(`[Contentful] Error fetching content by ID ${id}:`, error);
    throw new ContentfulError(`Failed to fetch content with ID ${id} from Contentful`, error);
  }
}

export function isContentfulConfigured(): boolean {
  return client !== null;
}

// Care Pathway Contentful Types
interface ContentfulPathwayMilestoneFields {
  title: string;
  weekNumber: number;
  description?: string | ContentfulRichText;
  contentReferences?: Entry<ContentfulContentItem>[];
}

interface ContentfulPathwayMilestone extends EntrySkeletonType {
  contentTypeId: "pathwayMilestone";
  fields: ContentfulPathwayMilestoneFields;
}

interface ContentfulCarePathwayFields {
  name: string;
  description?: string | ContentfulRichText;
  condition?: string;
  durationWeeks?: number;
  milestones?: Entry<ContentfulPathwayMilestone>[];
  isActive?: boolean;
}

interface ContentfulCarePathway extends EntrySkeletonType {
  contentTypeId: "carePathway";
  fields: ContentfulCarePathwayFields;
}

function parseContentfulPathwayMilestone(entry: Entry<ContentfulPathwayMilestone>, pathwayId: string): PathwayMilestone {
  const fields = entry.fields as unknown as ContentfulPathwayMilestoneFields;

  const contentIds = (fields.contentReferences || [])
    .map(ref => ref?.sys?.id)
    .filter((id): id is string => Boolean(id));

  return {
    id: entry.sys.id,
    pathwayId,
    weekNumber: fields.weekNumber || 1,
    title: fields.title || "",
    description: extractTextFromRichText(fields.description || ""),
    contentIds,
    assessmentId: null,
    createdAt: new Date(entry.sys.createdAt),
  };
}

function parseContentfulCarePathway(entry: Entry<ContentfulCarePathway>): CarePathway & { milestones: PathwayMilestone[] } {
  const fields = entry.fields as unknown as ContentfulCarePathwayFields;

  console.log("[Contentful] Parsing pathway:", entry.sys.id, "Name:", fields.name);

  const milestones = (fields.milestones || [])
    .map(m => parseContentfulPathwayMilestone(m, entry.sys.id))
    .sort((a, b) => a.weekNumber - b.weekNumber);

  return {
    id: entry.sys.id,
    clinicianUserId: null,
    name: fields.name || "",
    description: extractTextFromRichText(fields.description || ""),
    condition: fields.condition || null,
    durationWeeks: fields.durationWeeks || 8,
    isTemplate: true,
    isActive: fields.isActive !== false,
    createdAt: new Date(entry.sys.createdAt),
    milestones,
  };
}

export async function getAllPathwaysFromContentful(): Promise<(CarePathway & { milestones: PathwayMilestone[] })[]> {
  if (!client) {
    throw new ContentfulError("Contentful client not initialized");
  }

  const cached = getCache<(CarePathway & { milestones: PathwayMilestone[] })[]>("pathways:all");
  if (cached) {
    return cached;
  }

  console.log("[Contentful] Fetching all care pathways...");

  try {
    const entries = await client.getEntries<ContentfulCarePathway>({
      content_type: "carePathway",
      include: 2,
    });

    console.log(`[Contentful] Found ${entries.items.length} care pathways`);

    const parsedPathways = entries.items.map(parseContentfulCarePathway);
    setCache("pathways:all", parsedPathways);
    for (const item of parsedPathways) {
      setCache(`pathways:id:${item.id}`, item);
    }

    return parsedPathways;
  } catch (error: any) {
    if (error?.sys?.id === "NotFound" || error?.message?.includes("Unknown content type")) {
      console.log("[Contentful] carePathway content type not found, returning empty array");
      return [];
    }
    console.error("[Contentful] Error fetching pathways:", error);
    throw new ContentfulError("Failed to fetch pathways from Contentful", error);
  }
}

export async function getPathwayByIdFromContentful(id: string): Promise<(CarePathway & { milestones: PathwayMilestone[] }) | null> {
  if (!client) {
    throw new ContentfulError("Contentful client not initialized");
  }

  const cached = getCache<(CarePathway & { milestones: PathwayMilestone[] })>(`pathways:id:${id}`);
  if (cached) {
    return cached;
  }

  const listCached = getCache<(CarePathway & { milestones: PathwayMilestone[] })[]>("pathways:all");
  if (listCached) {
    const match = listCached.find(item => item.id === id) || null;
    if (match) {
      return match;
    }
  }

  console.log(`[Contentful] Fetching pathway by ID: ${id}`);

  try {
    const entry = await client.getEntry<ContentfulCarePathway>(id, { include: 2 });
    const parsed = parseContentfulCarePathway(entry);
    setCache(`pathways:id:${id}`, parsed);
    return parsed;
  } catch (error: any) {
    if (error?.sys?.id === "NotFound") {
      return null;
    }
    console.error(`[Contentful] Error fetching pathway by ID ${id}:`, error);
    throw new ContentfulError(`Failed to fetch pathway with ID ${id} from Contentful`, error);
  }
}
