/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import type { DataInventory } from "@shared/schema";

export async function getDataInventory(ctx: AppContext): Promise<DataInventory[]> {
  return ctx.storage.getDataInventory();
}
