export const UPLOAD_METHOD = "PUT";
export const IDEMPOTENCY_HEADER = "idempotency-key";
export const CONTENT_TYPE_HEADER = "content-type";
export const CACHE_CONTROL_HEADER = "cache-control";
export const PRIVATE_RESPONSE_CACHE_CONTROL = "no-store";
export const CHECKSUM_SHA256_HEADER = "x-amz-checksum-sha256";
export const ASSET_ID_METADATA_KEY = "asset-id";
export const USER_ID_METADATA_KEY = "user-id";
export const VEHICLE_ID_METADATA_KEY = "vehicle-id";

export const UPLOAD_BAD_REQUEST_STATUS = 400;
export const UPLOAD_UNAUTHENTICATED_STATUS = 401;
export const UPLOAD_FORBIDDEN_STATUS = 403;
export const UPLOAD_NOT_FOUND_STATUS = 404;
export const UPLOAD_CONFLICT_STATUS = 409;
export const UPLOAD_INVALID_STATUS = 422;
export const UPLOAD_UNAVAILABLE_STATUS = 503;

export const UPLOAD_BAD_REQUEST_CODE = "BAD_REQUEST";
export const UPLOAD_UNAUTHENTICATED_CODE = "UNAUTHENTICATED";
export const UPLOAD_FORBIDDEN_CODE = "FORBIDDEN";
export const UPLOAD_NOT_FOUND_CODE = "NOT_FOUND";
export const UPLOAD_CONFLICT_CODE = "CONFLICT";
export const UPLOAD_UNAVAILABLE_CODE = "SERVICE_UNAVAILABLE";

export const UPLOAD_INVALID_REQUEST_MESSAGE = "Enter valid upload details.";
export const UPLOAD_LIMIT_EXCEEDED_MESSAGE =
  "The selected image exceeds the configured upload limit.";
export const UPLOAD_INVALID_IDEMPOTENCY_MESSAGE =
  "Provide a valid Idempotency-Key header.";
export const UPLOAD_UNAUTHENTICATED_MESSAGE = "Sign in to upload images.";
export const UPLOAD_REMOVE_UNAUTHENTICATED_MESSAGE =
  "Sign in to remove images.";
export const UPLOAD_FORBIDDEN_MESSAGE = "The request origin is not allowed.";
export const UPLOAD_VEHICLE_NOT_FOUND_MESSAGE = "The vehicle could not be found.";
export const UPLOAD_ASSET_NOT_FOUND_MESSAGE = "The image upload could not be found.";
export const UPLOAD_IDEMPOTENCY_CONFLICT_MESSAGE =
  "That idempotency key was already used for different upload details.";
export const UPLOAD_OBJECT_MISSING_MESSAGE =
  "The uploaded object is not available in storage.";
export const UPLOAD_OBJECT_INVALID_MESSAGE =
  "The uploaded object failed image validation.";
export const UPLOAD_ASSET_INVALID_MESSAGE =
  "The image upload was previously marked invalid.";
export const UPLOAD_UNAVAILABLE_MESSAGE =
  "Image storage is temporarily unavailable. Please try again.";
export const UPLOAD_REMOVE_CONFLICT_MESSAGE =
  "This image is not removable from the upload selection.";
export const UPLOAD_REMOVE_UNAVAILABLE_MESSAGE =
  "The image could not be removed from storage. Please try again.";
export const UPLOAD_RATE_LIMITED_MESSAGE =
  "Too many upload requests. Wait before trying again.";
export const INVALID_UPLOAD_INTENT_REASON =
  "The upload intent contains invalid image metadata.";
