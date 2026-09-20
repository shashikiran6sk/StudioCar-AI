import {
  MAXIMUM_EMAIL_CLAIM_TTL_MILLISECONDS,
  MINIMUM_EMAIL_CLAIM_TTL_MILLISECONDS,
} from "./email.constants";
import type { EmailDeliveryProcessorOptions } from "./email.types";

export function validateEmailDeliveryProcessorOptions(
  options: EmailDeliveryProcessorOptions,
): void {
  new URL(options.applicationBaseUrl);
  if (
    !Number.isInteger(options.claimTtlMilliseconds) ||
    options.claimTtlMilliseconds < MINIMUM_EMAIL_CLAIM_TTL_MILLISECONDS ||
    options.claimTtlMilliseconds > MAXIMUM_EMAIL_CLAIM_TTL_MILLISECONDS
  ) {
    throw new RangeError(
      `claimTtlMilliseconds must be an integer between ${String(MINIMUM_EMAIL_CLAIM_TTL_MILLISECONDS)} and ${String(MAXIMUM_EMAIL_CLAIM_TTL_MILLISECONDS)}.`,
    );
  }
}
