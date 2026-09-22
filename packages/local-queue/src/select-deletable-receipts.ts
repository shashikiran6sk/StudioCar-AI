import type { SqsBatchResponse } from "@studiocar/contracts";

import type { LocalQueueMessage } from "./local-queue.types";

/**
 * Mirrors `ReportBatchItemFailures`: everything the handler did not name as a
 * failure is acknowledged, and the rest is left for redelivery once the
 * visibility timeout lapses.
 */
export function selectDeletableReceipts(
  messages: readonly LocalQueueMessage[],
  response: SqsBatchResponse,
): LocalQueueMessage[] {
  const failed = new Set(
    response.batchItemFailures.map((failure) => failure.itemIdentifier),
  );
  return messages.filter((message) => !failed.has(message.messageId));
}
