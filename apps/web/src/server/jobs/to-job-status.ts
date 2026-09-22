import {
  JobStatusSchema,
  type JobStatus,
} from "@studiocar/contracts";
import { ProcessingJobStatus } from "@studiocar/database-runtime";
import { type ProcessingJobStatusRecord } from "../db/repositories/processing-job-status-repository";

import {
  PROCESSING_STATUS_FALLBACK_ERROR_CODE,
  PROCESSING_STATUS_MISSING_OUTPUT_MESSAGE,
} from "./processing-status.constants";

export function toJobStatus(job: ProcessingJobStatusRecord): JobStatus {
  const base = {
    assetId: job.imageAssetId,
    jobId: job.id,
    updatedAt: job.updatedAt.toISOString(),
    vehicleId: job.vehicle.id,
    vehicleName: job.vehicle.name,
  };

  if (job.status === ProcessingJobStatus.CREATED) {
    return JobStatusSchema.parse({ ...base, stage: "UPLOADING", state: "CREATED" });
  }
  if (job.status === ProcessingJobStatus.QUEUED) {
    return JobStatusSchema.parse({ ...base, stage: "QUEUED", state: "QUEUED" });
  }
  if (job.status === ProcessingJobStatus.PROCESSING) {
    return JobStatusSchema.parse({
      ...base,
      stage: "REMOVING_BACKGROUND",
      state: "PROCESSING",
    });
  }
  if (job.status === ProcessingJobStatus.RETRYING) {
    return JobStatusSchema.parse({
      ...base,
      nextAttemptAt: job.nextAttemptAt?.toISOString(),
      stage: "QUEUED",
      state: "RETRYING",
    });
  }
  if (job.status === ProcessingJobStatus.COMPLETED) {
    if (!job.processedAsset) throw new Error(PROCESSING_STATUS_MISSING_OUTPUT_MESSAGE);
    return JobStatusSchema.parse({
      ...base,
      processedAssetId: job.processedAsset.id,
      stage: "COMPLETE",
      state: "COMPLETED",
    });
  }
  if (job.status === ProcessingJobStatus.FAILED) {
    return JobStatusSchema.parse({
      ...base,
      errorCode: job.errorCode ?? PROCESSING_STATUS_FALLBACK_ERROR_CODE,
      retryable: job.attempts[0]?.retryable ?? false,
      stage: "REMOVING_BACKGROUND",
      state: "FAILED",
    });
  }
  return JobStatusSchema.parse({
    ...base,
    stage: "QUEUED",
    state: "CANCELLED",
  });
}
