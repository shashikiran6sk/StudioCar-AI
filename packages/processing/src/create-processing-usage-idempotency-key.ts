import {
  PROCESSING_USAGE_EVENT_PREFIX,
  PROCESSING_USAGE_EVENT_SUFFIX,
} from "./processing-worker.constants";

export function createProcessingUsageIdempotencyKey(jobId: string): string {
  return `${PROCESSING_USAGE_EVENT_PREFIX}:${jobId}:${PROCESSING_USAGE_EVENT_SUFFIX}`;
}
