import { getAllContentFromContentful, isContentfulConfigured } from "../server/contentful";
import { pool, storage } from "../server/storage";

async function syncContentful(): Promise<void> {
  const startTime = Date.now();
  console.log("[Contentful Sync] Starting sync...");

  if (!isContentfulConfigured()) {
    const missingVars: string[] = [];
    if (!process.env.CONTENTFUL_SPACE_ID) {
      missingVars.push("CONTENTFUL_SPACE_ID");
    }
    if (!process.env.CONTENTFUL_ACCESS_TOKEN) {
      missingVars.push("CONTENTFUL_ACCESS_TOKEN");
    }
    let detail: string;
    if (missingVars.length > 0) {
      detail = `Missing environment variable${missingVars.length > 1 ? "s" : ""}: ${missingVars.join(", ")}.`;
    } else {
      detail =
        "CONTENTFUL_SPACE_ID and CONTENTFUL_ACCESS_TOKEN appear to be set, but the Contentful client failed to initialize. " +
        "Verify that the credentials are correct and that your Contentful configuration is valid.";
    }
    throw new Error(`Contentful client not initialized. ${detail}`);
  }

  console.log("[Contentful Sync] Fetching content from Contentful...");
  const items = await getAllContentFromContentful();
  console.log(`[Contentful Sync] Fetched ${items.length} content items from Contentful`);

  console.log("[Contentful Sync] Upserting content to database...");
  await storage.upsertContentItems(items);

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`[Contentful Sync] Completed successfully!`);
  console.log(`[Contentful Sync] Summary:`);
  console.log(`  - Items synced: ${items.length}`);
  console.log(`  - Duration: ${duration}s`);
}

syncContentful()
  .then(() => {
    if (pool && typeof pool.end === "function") {
      return pool.end();
    }
  })
  .catch(async (error) => {
    console.error("[Contentful Sync] Failed:", error);
    if (pool && typeof pool.end === "function") {
      await pool.end().catch((poolError: unknown) => {
        console.error("[Contentful Sync] Failed to close pool:", poolError);
      });
    }
    process.exit(1);
  });
