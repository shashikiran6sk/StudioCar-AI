import {
  ApplicationErrorCode,
  flushErrorTracking,
  initializeErrorTracking,
  reportUnexpectedError,
} from "@studiocar/observability";
import type { SqsBatchResponse } from "@studiocar/contracts";

import { handleProcessingQueueEvent } from "./handle-processing-queue-event";
import { getImageProcessingWorker } from "./runtime/get-image-processing-worker";

initializeErrorTracking(process.env);

export async function handler(event: unknown): Promise<SqsBatchResponse> {
  try {
    return await handleProcessingQueueEvent(event, getImageProcessingWorker());
  } catch (error) {
    reportUnexpectedError(error, ApplicationErrorCode.SQS_JOB_FAILED);
    throw error;
  } finally {
    await flushErrorTracking();
  }
}
