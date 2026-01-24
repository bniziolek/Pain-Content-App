/**
 * Architecture: Background job runner for scheduled or offline work.
 */

import { startBackgroundJobs as startJobs } from "./application";

export async function startBackgroundJobs() {
  return startJobs();
}
