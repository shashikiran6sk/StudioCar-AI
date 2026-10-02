/**
 * Broad, low-cardinality reasons a provider exchange failed. Each becomes a
 * metric and maps to one worker failure kind.
 */
export type ProviderFailureCategory =
  | "AUTHORIZATION"
  | "CONTENT_BLOCKED"
  | "DOWNLOAD_FAILED"
  | "INVALID_OUTPUT"
  | "INVALID_RESPONSE"
  | "NETWORK"
  | "PAYMENT_REQUIRED"
  | "RATE_LIMITED"
  | "REJECTED"
  | "SERVER_ERROR"
  | "SOURCE_UNAVAILABLE"
  | "TIMEOUT";
