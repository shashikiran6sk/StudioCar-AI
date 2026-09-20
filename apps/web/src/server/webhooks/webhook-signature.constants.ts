export const WEBHOOK_HMAC_ALGORITHM = "sha256";
export const WEBHOOK_HMAC_DIGEST_ENCODING = "hex";
export const WEBHOOK_SIGNING_SEPARATOR = ".";
export const WEBHOOK_MINIMUM_SECRET_BYTES = 32;
export const WEBHOOK_MINIMUM_TOLERANCE_SECONDS = 1;
export const WEBHOOK_MAXIMUM_TOLERANCE_SECONDS = 900;
export const WEBHOOK_MAXIMUM_ROTATION_SECRETS = 2;
export const WEBHOOK_MAXIMUM_SIGNATURE_HEADER_LENGTH = 4_096;
export const WEBHOOK_MAXIMUM_CANDIDATE_SIGNATURES = 8;
export const WEBHOOK_SHA256_HEX_LENGTH = 64;
export const MILLISECONDS_PER_SECOND = 1_000;
export const INVALID_WEBHOOK_OPTIONS_MESSAGE =
  "Webhook signature verifier options are invalid.";

export enum WebhookSignatureFailureReason {
  MissingHeaders = "MISSING_HEADERS",
  InvalidSignature = "INVALID_SIGNATURE",
  StaleTimestamp = "STALE_TIMESTAMP",
}
