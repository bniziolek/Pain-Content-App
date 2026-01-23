import { getAllContentFromContentful, isContentfulConfigured } from "../server/contentful";
import { pool, storage } from "../server/storage";

async function syncContentful(): Promise<void> {
  if (!isContentfulConfigured()) {
    const missingVars: string[] = [];
    if (!process.env.CONTENTFUL_SPACE_ID) {
      missingVars.push("CONTENTFUL_SPACE_ID");
    }
    if (!process.env.CONTENTFUL_ACCESS_TOKEN) {
      missingVars.push("CONTENTFUL_ACCESS_TOKEN");
    }
    const detail =
      missingVars.length > 0
        ? `Missing environment variable${missingVars.length > 1 ? "s" : ""}: ${missingVars.join(", ")}.`
        : "Check CONTENTFUL_SPACE_ID and CONTENTFUL_ACCESS_TOKEN.";
    throw new Error(`Contentful client not initialized. ${detail}`);
  }

  const items = await getAllContentFromContentful();
  await storage.upsertContentItems(items);

  console.log(`[Contentful Sync] Upserted ${items.length} content items.`);
}

syncContentful()
  .then(() => pool.end())
  .catch(async (error) => {
    console.error("[Contentful Sync] Failed:", error);
    await pool.end().catch((poolError) => {
      console.error("[Contentful Sync] Failed to close pool:", poolError);
    });
    process.exit(1);
  });
