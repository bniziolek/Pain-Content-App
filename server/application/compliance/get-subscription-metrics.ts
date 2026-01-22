/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import type { SubscriptionMetrics } from "../../storage";

export async function getSubscriptionMetrics(ctx: AppContext): Promise<SubscriptionMetrics> {
  return ctx.storage.getSubscriptionMetrics();
}
