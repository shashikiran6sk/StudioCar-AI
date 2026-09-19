import type { SqsBatchResponse } from "@studiocar/contracts";

import { handleProcessingQueueEvent } from "./handle-processing-queue-event";
import { getImageProcessingWorker } from "./runtime/get-image-processing-worker";

export function handler(event: unknown): Promise<SqsBatchResponse> {
  return handleProcessingQueueEvent(event, getImageProcessingWorker());
}
