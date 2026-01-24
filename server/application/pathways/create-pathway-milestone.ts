/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";

export interface CreatePathwayMilestoneInput {
  pathwayId: string;
  weekNumber?: number;
  title?: string;
  description?: string;
  contentIds?: string[];
  assessmentId?: string;
}

export async function createPathwayMilestone(
  ctx: AppContext,
  input: CreatePathwayMilestoneInput
): Promise<unknown> {
  return ctx.storage.createPathwayMilestone({
    pathwayId: input.pathwayId,
    weekNumber: input.weekNumber ?? 1,
    title: input.title ?? "Untitled Milestone",
    description: input.description,
    contentIds: input.contentIds,
    assessmentId: input.assessmentId,
  });
}
