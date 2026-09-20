import {
  INVALID_WEBHOOK_OPTIONS_MESSAGE,
  WEBHOOK_MAXIMUM_ROTATION_SECRETS,
  WEBHOOK_MAXIMUM_TOLERANCE_SECONDS,
  WEBHOOK_MINIMUM_SECRET_BYTES,
  WEBHOOK_MINIMUM_TOLERANCE_SECONDS,
} from "./webhook-signature.constants";
import type { HmacSha256WebhookSignatureOptions } from "./webhook-signature.types";

const HTTP_HEADER_NAME_PATTERN = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;

export function validateWebhookSignatureOptions(
  options: HmacSha256WebhookSignatureOptions,
): void {
  const headersAreValid =
    HTTP_HEADER_NAME_PATTERN.test(options.signatureHeaderName) &&
    HTTP_HEADER_NAME_PATTERN.test(options.timestampHeaderName);
  const secretsAreValid =
    options.secrets.length > 0 &&
    options.secrets.length <= WEBHOOK_MAXIMUM_ROTATION_SECRETS &&
    options.secrets.every(
      (secret) => Buffer.byteLength(secret, "utf8") >= WEBHOOK_MINIMUM_SECRET_BYTES,
    );
  const toleranceIsValid =
    Number.isInteger(options.toleranceSeconds) &&
    options.toleranceSeconds >= WEBHOOK_MINIMUM_TOLERANCE_SECONDS &&
    options.toleranceSeconds <= WEBHOOK_MAXIMUM_TOLERANCE_SECONDS;

  if (
    !headersAreValid ||
    !options.signaturePrefix ||
    !secretsAreValid ||
    !toleranceIsValid
  ) {
    throw new TypeError(INVALID_WEBHOOK_OPTIONS_MESSAGE);
  }
}
