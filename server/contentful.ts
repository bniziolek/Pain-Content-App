import { createClient, type Entry, type EntrySkeletonType, type Asset } from "contentful";
import type { ContentItem } from "@shared/schema";

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
  };
}

export async function getAllContentFromContentful(): Promise<ContentItem[]> {
  if (!client) {
    throw new ContentfulError("Contentful client not initialized");
  }

  console.log("[Contentful] Fetching all content items...");

  try {
    const entries = await client.getEntries<ContentfulContentItem>({
      content_type: "contentItem",
      order: ["-sys.createdAt"],
    });

    console.log(`[Contentful] Found ${entries.items.length} content items`);
    
    return entries.items.map(parseContentfulEntry);
  } catch (error) {
    console.error("[Contentful] Error fetching content:", error);
    throw new ContentfulError("Failed to fetch content from Contentful", error);
  }
}

export async function getContentByIdFromContentful(id: string): Promise<ContentItem | null> {
  if (!client) {
    throw new ContentfulError("Contentful client not initialized");
  }

  console.log(`[Contentful] Fetching content by ID: ${id}`);

  try {
    const entry = await client.getEntry<ContentfulContentItem>(id);
    return parseContentfulEntry(entry);
  } catch (error) {
    console.error(`[Contentful] Error fetching content by ID ${id}:`, error);
    throw new ContentfulError(`Failed to fetch content with ID ${id} from Contentful`, error);
  }
}

export function isContentfulConfigured(): boolean {
  return client !== null;
}
