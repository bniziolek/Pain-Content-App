import type { AppContext } from "../context";
import type { DataInventory } from "@shared/schema";

export async function getDataInventory(ctx: AppContext): Promise<DataInventory[]> {
  return ctx.storage.getDataInventory();
}
