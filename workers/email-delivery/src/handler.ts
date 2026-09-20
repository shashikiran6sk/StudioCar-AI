import type { SqsBatchResponse } from "@studiocar/contracts";

import { handleEmailQueueEvent } from "./handle-email-queue-event";
import { getEmailDeliveryWorker } from "./runtime/get-email-delivery-worker";

export function handler(event: unknown): Promise<SqsBatchResponse> {
  return handleEmailQueueEvent(event, getEmailDeliveryWorker());
}
