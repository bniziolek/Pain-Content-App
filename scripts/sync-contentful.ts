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

  const items = await getAllContentFromContentful();
  await storage.upsertContentItems(items);

  console.log(`[Contentful Sync] Upserted ${items.length} content items.`);
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
