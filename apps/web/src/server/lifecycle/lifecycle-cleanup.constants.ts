export const MILLISECONDS_PER_HOUR = 60 * 60 * 1_000;
export const MILLISECONDS_PER_DAY = 24 * MILLISECONDS_PER_HOUR;
export const LIFECYCLE_CACHE_CONTROL_HEADER = "cache-control";
export const LIFECYCLE_PRIVATE_CACHE_CONTROL = "no-store";
export const LIFECYCLE_FORBIDDEN_STATUS = 403;
export const LIFECYCLE_UNAVAILABLE_STATUS = 503;
export const LIFECYCLE_FORBIDDEN_CODE = "FORBIDDEN";
export const LIFECYCLE_UNAVAILABLE_CODE = "SERVICE_UNAVAILABLE";
export const LIFECYCLE_FORBIDDEN_MESSAGE = "The request is not allowed.";
export const LIFECYCLE_UNAVAILABLE_MESSAGE =
  "Lifecycle cleanup is temporarily unavailable.";
