import { createClient, type Entry, type EntrySkeletonType } from "contentful";
import type { ContentItem } from "@shared/schema";

interface ContentfulFields {
  title: string;
  summary: string;
  body: string;
  tags?: string[];
  imageUrl?: string;
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

function parseContentfulEntry(entry: Entry<ContentfulContentItem>): ContentItem {
  const fields = entry.fields as unknown as ContentfulFields;
  
  return {
    id: entry.sys.id,
    title: fields.title || "",
    summary: fields.summary || "",
    body: fields.body || "",
    tags: fields.tags || [],
    imageUrl: fields.imageUrl || null,
    readTime: fields.readTime || "5 min",
    createdAt: new Date(entry.sys.createdAt),
    updatedAt: new Date(entry.sys.updatedAt),
  };
}

export async function getAllContentFromContentful(): Promise<ContentItem[]> {
  if (!client) {
    throw new ContentfulError("Contentful client not initialized");
  }

  try {
    const entries = await client.getEntries<ContentfulContentItem>({
      content_type: "contentItem",
      order: ["-sys.createdAt"],
    });

    return entries.items.map(parseContentfulEntry);
  } catch (error) {
    console.error("Error fetching content from Contentful:", error);
    throw new ContentfulError("Failed to fetch content from Contentful", error);
  }
}

export async function getContentByIdFromContentful(id: string): Promise<ContentItem | null> {
  if (!client) {
    throw new ContentfulError("Contentful client not initialized");
  }

  try {
    const entry = await client.getEntry<ContentfulContentItem>(id);
    return parseContentfulEntry(entry);
  } catch (error) {
    console.error("Error fetching content by ID from Contentful:", error);
    throw new ContentfulError(`Failed to fetch content with ID ${id} from Contentful`, error);
  }
}

export function isContentfulConfigured(): boolean {
  return client !== null;
}
