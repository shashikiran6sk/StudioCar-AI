import {
  MAXIMUM_CLAIM_TTL_MILLISECONDS,
  MAXIMUM_OUTBOX_BATCH_SIZE,
  MAXIMUM_RETRY_MILLISECONDS,
  MINIMUM_CLAIM_TTL_MILLISECONDS,
  MINIMUM_OUTBOX_BATCH_SIZE,
  MINIMUM_RETRY_MILLISECONDS,
} from "./processing-outbox.constants";
import type { ProcessingOutboxDispatcherOptions } from "./processing-outbox.types";

function requireBoundedInteger(
  value: number,
  minimum: number,
  maximum: number,
  label: string,
): void {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new RangeError(
      `${label} must be an integer between ${String(minimum)} and ${String(maximum)}.`,
    );
  }
}

export function validateProcessingOutboxDispatcherOptions(
  options: ProcessingOutboxDispatcherOptions,
): void {
  requireBoundedInteger(
    options.batchSize,
    MINIMUM_OUTBOX_BATCH_SIZE,
    MAXIMUM_OUTBOX_BATCH_SIZE,
    "batchSize",
  );
  requireBoundedInteger(
    options.claimTtlMilliseconds,
    MINIMUM_CLAIM_TTL_MILLISECONDS,
    MAXIMUM_CLAIM_TTL_MILLISECONDS,
    "claimTtlMilliseconds",
  );
  requireBoundedInteger(
    options.retryBaseMilliseconds,
    MINIMUM_RETRY_MILLISECONDS,
    MAXIMUM_RETRY_MILLISECONDS,
    "retryBaseMilliseconds",
  );
  requireBoundedInteger(
    options.retryMaximumMilliseconds,
    options.retryBaseMilliseconds,
    MAXIMUM_RETRY_MILLISECONDS,
    "retryMaximumMilliseconds",
  );
}
