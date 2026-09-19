export const PROCESSING_STATUS_BAD_REQUEST_CODE = "BAD_REQUEST";
export const PROCESSING_STATUS_BAD_REQUEST_MESSAGE =
  "Provide between 1 and 100 unique job IDs.";
export const PROCESSING_STATUS_BAD_REQUEST_STATUS = 400;
export const PROCESSING_STATUS_NOT_FOUND_CODE = "NOT_FOUND";
export const PROCESSING_STATUS_NOT_FOUND_MESSAGE =
  "One or more processing jobs could not be found.";
export const PROCESSING_STATUS_NOT_FOUND_STATUS = 404;
export const PROCESSING_STATUS_UNAUTHENTICATED_CODE = "UNAUTHENTICATED";
export const PROCESSING_STATUS_UNAUTHENTICATED_MESSAGE =
  "Sign in to view processing status.";
export const PROCESSING_STATUS_UNAUTHENTICATED_STATUS = 401;
export const PROCESSING_STATUS_UNAVAILABLE_CODE = "SERVICE_UNAVAILABLE";
export const PROCESSING_STATUS_UNAVAILABLE_MESSAGE =
  "Processing status is temporarily unavailable.";
export const PROCESSING_STATUS_UNAVAILABLE_STATUS = 503;
export const PROCESSING_STATUS_CACHE_CONTROL = "private, no-store";
export const PROCESSING_STATUS_CACHE_CONTROL_HEADER = "cache-control";
export const PROCESSING_STATUS_IDS_PARAMETER = "ids";
export const PROCESSING_STATUS_FALLBACK_ERROR_CODE = "PROCESSING_FAILED";
export const PROCESSING_STATUS_MISSING_OUTPUT_MESSAGE =
  "A completed processing job has no processed asset.";
