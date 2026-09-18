export const PHONE_OTP_BINDING_BYTES = 32;
export const MILLISECONDS_PER_SECOND = 1_000;
export const PHONE_IDENTIFIER_PREFIX = "phone:";
export const IP_IDENTIFIER_PREFIX = "ip:";
export const PHONE_OTP_SEND_FAILURE_CODE = "provider_send_failed";

export const HTTP_CREATED_STATUS = 201;
export const HTTP_BAD_REQUEST_STATUS = 400;
export const HTTP_FORBIDDEN_STATUS = 403;
export const HTTP_CONFLICT_STATUS = 409;
export const HTTP_TOO_MANY_REQUESTS_STATUS = 429;
export const HTTP_SERVICE_UNAVAILABLE_STATUS = 503;
export const RETRY_AFTER_HEADER = "retry-after";

export const API_BAD_REQUEST_CODE = "BAD_REQUEST";
export const API_FORBIDDEN_CODE = "FORBIDDEN";
export const API_CONFLICT_CODE = "CONFLICT";
export const API_RATE_LIMITED_CODE = "RATE_LIMITED";
export const API_SERVICE_UNAVAILABLE_CODE = "SERVICE_UNAVAILABLE";

export const INVALID_REQUEST_MESSAGE = "The request is invalid.";
export const FORBIDDEN_REQUEST_MESSAGE = "The request origin is not allowed.";
export const RATE_LIMITED_MESSAGE = "Too many attempts. Try again later.";
export const INVALID_CHALLENGE_MESSAGE = "The OTP challenge is invalid or expired.";
export const INVALID_OTP_MESSAGE = "The OTP is invalid.";
export const IDENTITY_LINK_REQUIRED_MESSAGE =
  "This phone number is already associated with an account.";
export const PROVIDER_UNAVAILABLE_MESSAGE =
  "Phone verification is temporarily unavailable.";

export const MSG91_BASE_URL = "https://control.msg91.com";
export const MSG91_SEND_PATH = "/api/v5/otp";
export const MSG91_VERIFY_PATH = "/api/v5/otp/verify";
export const MSG91_AUTH_HEADER = "authkey";
export const MSG91_ACCEPT_HEADER = "accept";
export const JSON_MEDIA_TYPE = "application/json";
export const MSG91_SUCCESS_TYPE = "success";
export const MSG91_ERROR_TYPE = "error";
export const MSG91_EXPIRED_MESSAGE_FRAGMENT = "expired";
export const MSG91_INVALID_MESSAGE_FRAGMENTS: readonly string[] = [
  "invalid",
  "match",
];
