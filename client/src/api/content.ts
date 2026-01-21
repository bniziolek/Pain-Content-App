import { fetchAPI, jsonHeaders } from "./base";
import type { ContentItem, ContentView } from "@shared/api-types";

// Content CRUD
export async function getContent(): Promise<ContentItem[]> {
  return fetchAPI("/content");
}

export async function getContentById(id: string): Promise<ContentItem> {
  return fetchAPI(`/content/${id}`);
}

export async function createContent(content: Omit<ContentItem, "id" | "createdAt" | "updatedAt">): Promise<ContentItem> {
  return fetchAPI("/content", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(content),
  });
}

export async function updateContent(id: string, content: Partial<ContentItem>): Promise<ContentItem> {
  return fetchAPI(`/content/${id}`, {
    method: "PATCH",
    headers: jsonHeaders(),
    body: JSON.stringify(content),
  });
}

export async function deleteContent(id: string): Promise<void> {
  await fetchAPI(`/content/${id}`, { method: "DELETE" });
}

// Favorites
export async function getFavorites(): Promise<ContentItem[]> {
  return fetchAPI("/favorites");
}

export async function addFavorite(contentId: string): Promise<void> {
  await fetchAPI(`/favorites/${contentId}`, { method: "POST" });
}

export async function removeFavorite(contentId: string): Promise<void> {
  await fetchAPI(`/favorites/${contentId}`, { method: "DELETE" });
}

export async function checkFavorite(contentId: string): Promise<{ isFavorite: boolean }> {
  return fetchAPI(`/favorites/check/${contentId}`);
}

// Frequently Used
export async function getFrequentlyUsedContent(limit = 5): Promise<ContentItem[]> {
  return fetchAPI(`/content/frequently-used?limit=${limit}`);
}

// Collections
export interface ContentCollection {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  createdAt: string;
}

export async function getCollections(): Promise<ContentCollection[]> {
  return fetchAPI("/collections");
}

export async function createCollection(name: string, description?: string): Promise<ContentCollection> {
  return fetchAPI("/collections", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ name, description }),
  });
}

export async function getCollectionWithItems(id: string): Promise<ContentCollection & { items: ContentItem[] }> {
  return fetchAPI(`/collections/${id}`);
}

export async function updateCollection(id: string, updates: { name?: string; description?: string }): Promise<ContentCollection> {
  return fetchAPI(`/collections/${id}`, {
    method: "PATCH",
    headers: jsonHeaders(),
    body: JSON.stringify(updates),
  });
}

export async function deleteCollection(id: string): Promise<void> {
  await fetchAPI(`/collections/${id}`, { method: "DELETE" });
}

export async function addToCollection(collectionId: string, contentId: string): Promise<void> {
  await fetchAPI(`/collections/${collectionId}/items`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ contentId }),
  });
}

export async function removeFromCollection(collectionId: string, contentId: string): Promise<void> {
  await fetchAPI(`/collections/${collectionId}/items/${contentId}`, { method: "DELETE" });
}

