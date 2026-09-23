import { jobRequiresUserAttention } from "@studiocar/processing";

import type { PortfolioVehicleRecord } from "../db/repositories/portfolio-repository";
import { NEEDS_ATTENTION_VEHICLE_STATUSES } from "../vehicles/vehicle-status-groups.constants";
import { selectLatestBatchJobs } from "./select-latest-batch-jobs";

export interface AttentionBatch {
  failedJobs: PortfolioVehicleRecord["processingJobs"];
  jobs: PortfolioVehicleRecord["processingJobs"];
}

/**
 * The newest batch and its failed jobs when the vehicle needs attention.
 * It reads the same vehicle status the dashboard and inventory filter read,
 * then names the images with the same job rule the worker applied.
 */
export function selectAttentionJobs(
  record: PortfolioVehicleRecord,
): AttentionBatch | null {
  if (!NEEDS_ATTENTION_VEHICLE_STATUSES.includes(record.status)) return null;
  const jobs = selectLatestBatchJobs(record.processingJobs);
  const failedJobs = jobs.filter((job) => jobRequiresUserAttention(job.status));
  return failedJobs.length > 0 ? { failedJobs, jobs } : null;
}
