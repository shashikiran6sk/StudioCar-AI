import type { ProcessingFailureKind } from "@studiocar/processing";

import type { ProviderFailureCategory } from "./provider-failure.types";

/**
 * How each provider failure is retried and recorded. Messages are stored on
 * the job for operators; people see only the mapped failure reason.
 *
 * Output problems (an unreadable response, an unusable file) are the
 * provider's, so they never mark the person's original as invalid. They are
 * also terminal: the provider has already charged for that generation, and a
 * retry would pay again for the same outcome.
 */
export const PROVIDER_FAILURES = {
  AUTHORIZATION: {
    kind: "AUTHORIZATION",
    message: "The background-removal provider rejected its server credentials.",
  },
  CONTENT_BLOCKED: {
    kind: "CONTENT_BLOCKED",
    message: "The background-removal provider withheld the result for this image.",
  },
  DOWNLOAD_FAILED: {
    kind: "NETWORK",
    message: "The background-removal result could not be downloaded.",
  },
  INVALID_OUTPUT: {
    kind: "UNUSABLE_PROVIDER_RESULT",
    message: "The background-removal provider returned an unusable image.",
  },
  INVALID_RESPONSE: {
    kind: "UNUSABLE_PROVIDER_RESULT",
    message: "The background-removal provider returned an invalid response.",
  },
  NETWORK: {
    kind: "NETWORK",
    message: "The background-removal provider could not be reached.",
  },
  PAYMENT_REQUIRED: {
    kind: "PAYMENT_REQUIRED",
    message: "The background-removal provider requires payment.",
  },
  RATE_LIMITED: {
    kind: "PROVIDER_429",
    message: "The background-removal provider rate limited the request.",
  },
  REJECTED: {
    kind: "INVALID_REQUEST",
    message: "The background-removal provider rejected the image request.",
  },
  SERVER_ERROR: {
    kind: "PROVIDER_5XX",
    message: "The background-removal provider is temporarily unavailable.",
  },
  SOURCE_UNAVAILABLE: {
    kind: "NETWORK",
    message: "A short-lived link to the source image could not be created.",
  },
  TIMEOUT: {
    kind: "TIMEOUT",
    message: "The background-removal provider timed out.",
  },
} as const satisfies Record<
  ProviderFailureCategory,
  { kind: ProcessingFailureKind; message: string }
>;
