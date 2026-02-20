/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import type { InsertDataInventory } from "@shared/schema";

export async function updateDataInventoryItem(
  ctx: AppContext,
  id: string,
  updates: Partial<InsertDataInventory>
): Promise<unknown> {
  return ctx.storage.updateDataInventoryItem(id, updates);
}
