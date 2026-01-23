/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import type { UserActivityAnalytics } from "../../storage";

export async function getUserActivityAnalytics(
  ctx: AppContext,
  days: number
): Promise<UserActivityAnalytics> {
  return ctx.storage.getUserActivityAnalytics(days);
}
