export const PROCESSING_WORKER_MINIMUM_DURATION_MS = 100;
export const PROCESSING_WORKER_MAXIMUM_DURATION_MS = 3_600_000;
/**
 * The dispatcher records a job as queued moments after sending its message,
 * so a worker that receives it first waits briefly before asking the queue to
 * deliver it again later.
 */
export const PROCESSING_PUBLICATION_WAIT_ATTEMPTS = 5;
export const PROCESSING_PUBLICATION_WAIT_MS = 200;
export const PROCESSING_USAGE_EVENT_PREFIX = "processing-job";
export const PROCESSING_USAGE_EVENT_SUFFIX = "background-removal-completed";
export const PROCESSING_ERROR_MESSAGE_MAX_LENGTH = 1_000;
export const PROCESSING_ERROR_MESSAGE_FALLBACK =
  "Image processing failed without a provider message.";

export const PROCESSING_FAILURE_CODES = {
  AUTHORIZATION: "PROVIDER_AUTHORIZATION_FAILED",
  INTERNAL: "PROCESSING_INTERNAL_ERROR",
  INVALID_IMAGE: "INVALID_IMAGE",
  INVALID_REQUEST: "PROVIDER_INVALID_REQUEST",
  NETWORK: "PROVIDER_NETWORK_ERROR",
  PROVIDER_429: "PROVIDER_RATE_LIMITED",
  PROVIDER_5XX: "PROVIDER_UNAVAILABLE",
  TIMEOUT: "PROVIDER_TIMEOUT",
  UNSUPPORTED_FORMAT: "UNSUPPORTED_IMAGE_FORMAT",
} satisfies Record<string, string>;
