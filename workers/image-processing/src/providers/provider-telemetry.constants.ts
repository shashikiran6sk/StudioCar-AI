import type { ProviderFailureCategory } from "./provider-failure.types";

export const PROVIDER_EXCHANGE_EVENT = "provider_exchange";
export const PROVIDER_DIMENSION = "Provider";

export const PROVIDER_METRICS = {
  request: "ProviderRequestCount",
  success: "ProviderSuccessCount",
  failure: "ProviderFailureCount",
  duration: "ProviderExchangeDurationMilliseconds",
  costCredits: "ProviderCostCredits",
  costDollars: "ProviderCostDollars",
} as const;

/** One counter per broad failure category; bounded by the category union. */
export const PROVIDER_FAILURE_METRICS = {
  AUTHORIZATION: "ProviderAuthorizationFailureCount",
  CONTENT_BLOCKED: "ProviderContentBlockedCount",
  DOWNLOAD_FAILED: "ProviderDownloadFailureCount",
  INVALID_OUTPUT: "ProviderInvalidOutputCount",
  INVALID_RESPONSE: "ProviderInvalidResponseCount",
  NETWORK: "ProviderNetworkErrorCount",
  PAYMENT_REQUIRED: "ProviderPaymentRequiredCount",
  RATE_LIMITED: "ProviderRateLimitedResponseCount",
  REJECTED: "ProviderRejectedRequestCount",
  SERVER_ERROR: "ProviderServerErrorResponseCount",
  SOURCE_UNAVAILABLE: "ProviderSourceUnavailableCount",
  TIMEOUT: "ProviderTimeoutCount",
} as const satisfies Record<ProviderFailureCategory, string>;

export const PROVIDER_LOG_EVENTS = {
  started: "provider_request_started",
  generated: "provider_generation_charged",
  completed: "provider_request_completed",
  failed: "provider_request_failed",
} as const;

/** Response-issue codes for failures that happen before schema validation. */
export const PROVIDER_RESPONSE_ISSUES = {
  /** The body was empty, unreadable or over the JSON size limit. */
  unreadableBody: "unreadable_body",
  /** The body was not JSON. */
  invalidJson: "invalid_json",
} as const;
/** The path logged for an issue with the response body as a whole. */
export const PROVIDER_RESPONSE_ROOT_PATH = "root";
