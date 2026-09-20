import {
  MAXIMUM_EMAIL_BATCH_SIZE,
  MAXIMUM_EMAIL_CLAIM_TTL_MILLISECONDS,
  MAXIMUM_EMAIL_RETRY_MILLISECONDS,
  MINIMUM_EMAIL_BATCH_SIZE,
  MINIMUM_EMAIL_CLAIM_TTL_MILLISECONDS,
  MINIMUM_EMAIL_RETRY_MILLISECONDS,
} from "./email.constants";
import type { EmailOutboxDispatcherOptions } from "./email.types";

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

export function validateEmailOutboxDispatcherOptions(
  options: EmailOutboxDispatcherOptions,
): void {
  new URL(options.applicationBaseUrl);
  requireBoundedInteger(
    options.batchSize,
    MINIMUM_EMAIL_BATCH_SIZE,
    MAXIMUM_EMAIL_BATCH_SIZE,
    "batchSize",
  );
  requireBoundedInteger(
    options.claimTtlMilliseconds,
    MINIMUM_EMAIL_CLAIM_TTL_MILLISECONDS,
    MAXIMUM_EMAIL_CLAIM_TTL_MILLISECONDS,
    "claimTtlMilliseconds",
  );
  requireBoundedInteger(
    options.retryBaseMilliseconds,
    MINIMUM_EMAIL_RETRY_MILLISECONDS,
    MAXIMUM_EMAIL_RETRY_MILLISECONDS,
    "retryBaseMilliseconds",
  );
  requireBoundedInteger(
    options.retryMaximumMilliseconds,
    options.retryBaseMilliseconds,
    MAXIMUM_EMAIL_RETRY_MILLISECONDS,
    "retryMaximumMilliseconds",
  );
}
