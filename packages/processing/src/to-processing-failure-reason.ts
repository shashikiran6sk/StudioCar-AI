import type { JobState, ProcessingFailureReason } from "@studiocar/contracts";

import { PROCESSING_FAILURE_CODES } from "./processing-worker.constants";

const UNUSABLE_IMAGE_CODES: readonly string[] = [
  PROCESSING_FAILURE_CODES.INVALID_IMAGE,
  PROCESSING_FAILURE_CODES.UNSUPPORTED_FORMAT,
];

const SERVICE_UNAVAILABLE_CODES: readonly string[] = [
  PROCESSING_FAILURE_CODES.NETWORK,
  PROCESSING_FAILURE_CODES.PROVIDER_429,
  PROCESSING_FAILURE_CODES.PROVIDER_5XX,
  PROCESSING_FAILURE_CODES.TIMEOUT,
];

/**
 * Maps a stored failure to the reason shown to the person who owns the image.
 * The technical code stays in the database and the logs.
 */
export function toProcessingFailureReason(
  state: JobState,
  errorCode: string | null,
): ProcessingFailureReason {
  if (state === "CANCELLED") return "CANCELLED";
  if (errorCode === null) return "PROCESSING_FAILED";
  if (UNUSABLE_IMAGE_CODES.includes(errorCode)) return "UNUSABLE_IMAGE";
  if (SERVICE_UNAVAILABLE_CODES.includes(errorCode)) {
    return "SERVICE_UNAVAILABLE";
  }
  if (errorCode === PROCESSING_FAILURE_CODES.INVALID_REQUEST) {
    return "BACKGROUND_REMOVAL_FAILED";
  }
  return "PROCESSING_FAILED";
}
