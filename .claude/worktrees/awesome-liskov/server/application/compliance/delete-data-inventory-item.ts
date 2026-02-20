/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";

export async function deleteDataInventoryItem(
  ctx: AppContext,
  id: string
): Promise<void> {
  await ctx.storage.deleteDataInventoryItem(id);
}
