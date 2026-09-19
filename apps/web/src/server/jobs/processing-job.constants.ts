export const PROCESSING_IDEMPOTENCY_HEADER = "idempotency-key";
export const PROCESSING_CACHE_CONTROL_HEADER = "cache-control";
export const PROCESSING_PRIVATE_CACHE_CONTROL = "private, no-store";
export const PROCESSING_ACCEPTED_STATUS = 202;
export const PROCESSING_BAD_REQUEST_STATUS = 400;
export const PROCESSING_UNAUTHENTICATED_STATUS = 401;
export const PROCESSING_FORBIDDEN_STATUS = 403;
export const PROCESSING_NOT_FOUND_STATUS = 404;
export const PROCESSING_CONFLICT_STATUS = 409;
export const PROCESSING_UNAVAILABLE_STATUS = 503;
export const PROCESSING_BAD_REQUEST_CODE = "BAD_REQUEST";
export const PROCESSING_UNAUTHENTICATED_CODE = "UNAUTHENTICATED";
export const PROCESSING_FORBIDDEN_CODE = "FORBIDDEN";
export const PROCESSING_NOT_FOUND_CODE = "NOT_FOUND";
export const PROCESSING_CONFLICT_CODE = "CONFLICT";
export const PROCESSING_UNAVAILABLE_CODE = "SERVICE_UNAVAILABLE";
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
export const PROCESSING_AUTHORIZATION_HEADER = "authorization";
export const PROCESSING_BEARER_PREFIX = "Bearer ";
