/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import type { InsertDataInventory } from "@shared/schema";

export async function createDataInventoryItem(
  ctx: AppContext,
  data: InsertDataInventory
): Promise<unknown> {
  return ctx.storage.createDataInventoryItem(data);
}
