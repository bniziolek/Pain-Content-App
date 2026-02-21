/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import type { AuditLog } from "@shared/schema";

export interface ListAuditLogsInput {
  userId?: string;
  action?: string;
  resourceType?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export async function listAuditLogs(
  ctx: AppContext,
  input: ListAuditLogsInput = {}
): Promise<AuditLog[]> {
  return ctx.storage.getAuditLogs({
    userId: input.userId,
    action: input.action,
    resourceType: input.resourceType,
    startDate: input.startDate,
    endDate: input.endDate,
    limit: input.limit ?? 100,
  });
}
