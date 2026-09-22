export const PROCESSING_IDEMPOTENCY_HEADER = "idempotency-key";
export const PROCESSING_CACHE_CONTROL_HEADER = "cache-control";
export const PROCESSING_PRIVATE_CACHE_CONTROL = "private, no-store";
export const PROCESSING_ACCEPTED_STATUS = 202;
export const PROCESSING_BAD_REQUEST_STATUS = 400;
export const PROCESSING_UNAUTHENTICATED_STATUS = 401;
export const PROCESSING_FORBIDDEN_STATUS = 403;
export const PROCESSING_NOT_FOUND_STATUS = 404;
export const PROCESSING_CONFLICT_STATUS = 409;
export const PROCESSING_UNPROCESSABLE_STATUS = 422;
export const PROCESSING_UNAVAILABLE_STATUS = 503;
export const PROCESSING_BAD_REQUEST_CODE = "BAD_REQUEST";
export const PROCESSING_UNAUTHENTICATED_CODE = "UNAUTHENTICATED";
export const PROCESSING_FORBIDDEN_CODE = "FORBIDDEN";
export const PROCESSING_NOT_FOUND_CODE = "NOT_FOUND";
export const PROCESSING_CONFLICT_CODE = "CONFLICT";
export const PROCESSING_UNAVAILABLE_CODE = "SERVICE_UNAVAILABLE";
export const PROCESSING_BATCH_LIMIT_CODE = "BATCH_LIMIT_EXCEEDED";
export const PROCESSING_ALLOWANCE_EXHAUSTED_CODE = "ALLOWANCE_EXHAUSTED";
export const PROCESSING_INVALID_REQUEST_MESSAGE =
  "Choose valid uploaded photos and processing options.";
export const PROCESSING_INVALID_IDEMPOTENCY_MESSAGE =
  "Provide a valid idempotency key.";
export const PROCESSING_UNAUTHENTICATED_MESSAGE =
  "Sign in to process vehicle photos.";
export const PROCESSING_FORBIDDEN_MESSAGE = "The request is not allowed.";
export const PROCESSING_NOT_FOUND_MESSAGE =
  "The vehicle draft could not be found.";
export const PROCESSING_ASSETS_NOT_READY_MESSAGE =
  "Every selected photo must finish uploading before processing starts.";
export const PROCESSING_IDEMPOTENCY_CONFLICT_MESSAGE =
  "That request key was already used for a different processing batch.";
export const PROCESSING_VEHICLE_NOT_DRAFT_MESSAGE =
  "This vehicle is no longer available for initial processing.";
export const PROCESSING_UNAVAILABLE_MESSAGE =
  "Processing could not be started. Your originals are preserved.";
export const PROCESSING_RATE_LIMITED_MESSAGE =
  "Too many processing requests. Wait before trying again.";

export function processingBatchLimitMessage(maxImagesPerBatch: number): string {
  return `Your plan allows up to ${String(maxImagesPerBatch)} images in one batch. Remove some images and try again.`;
}

export function processingAllowanceExhaustedMessage(
  imagesRemaining: number,
  imageCapacity: number,
): string {
  return imagesRemaining === 0
    ? `You have used all ${String(imageCapacity)} images included in your plan. Upgrade to process more.`
    : `Only ${String(imagesRemaining)} of your ${String(imageCapacity)} plan images remain. Reduce this batch or upgrade to process more.`;
}
