export const PHONE_OTP_BINDING_BYTES = 32;
export const MILLISECONDS_PER_SECOND = 1_000;
export const PHONE_IDENTIFIER_PREFIX = "phone:";
export const IP_IDENTIFIER_PREFIX = "ip:";
export const PHONE_OTP_SEND_FAILURE_CODE = "provider_send_failed";
export const PHONE_OTP_TOKEN_IDENTIFIER_PREFIX = "phone-otp-token:";

export const HTTP_CREATED_STATUS = 201;
export const HTTP_BAD_REQUEST_STATUS = 400;
export const HTTP_FORBIDDEN_STATUS = 403;
export const HTTP_CONFLICT_STATUS = 409;
export const HTTP_TOO_MANY_REQUESTS_STATUS = 429;
export const HTTP_SERVICE_UNAVAILABLE_STATUS = 503;
export const RETRY_AFTER_HEADER = "retry-after";
export const CACHE_CONTROL_HEADER = "cache-control";
export const PRIVATE_RESPONSE_CACHE_CONTROL = "no-store";

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
export const IDENTITY_LINK_TAKEN_MESSAGE =
  "That sign-in method already belongs to another StudioCar AI account.";
export const IDENTITY_LINK_REQUIRED_MESSAGE =
  "This phone number is already associated with an account.";
export const PROVIDER_UNAVAILABLE_MESSAGE =
  "Phone verification is temporarily unavailable.";
export const PHONE_VERIFICATION_REQUIRED_MESSAGE =
  "Verify your phone number again before creating an account.";
export const PHONE_ACCOUNT_TAKEN_MESSAGE =
  "This phone number was linked to an account. Sign in with the phone number instead.";
export const PHONE_ACCOUNT_UNAVAILABLE_MESSAGE =
  "Account creation is temporarily unavailable. Please try again.";

export const MSG91_BASE_URL = "https://control.msg91.com";
export const MSG91_VERIFY_ACCESS_TOKEN_PATH = "/api/v5/widget/verifyAccessToken";
export const MSG91_WIDGET_SCRIPT_URL = "https://verify.msg91.com/otp-provider.js";
export const MSG91_AUTH_KEY_FIELD = "authkey";
export const MSG91_ACCESS_TOKEN_FIELD = "access-token";
export const MSG91_ACCEPT_HEADER = "accept";
export const MSG91_CONTENT_TYPE_HEADER = "content-type";
export const JSON_MEDIA_TYPE = "application/json";
export const MSG91_SUCCESS_TYPE = "success";

export const DEVELOPMENT_OTP_TOKEN_PREFIX = "dev-otp:";
export const DEVELOPMENT_OTP_TOKEN_SEPARATOR = ":";

export const PHONE_OTP_WIDGET_DISABLED_REASON =
  "Set MSG91_WIDGET_ID, MSG91_WIDGET_TOKEN, and MSG91_AUTH_KEY to verify phone numbers.";
export const PHONE_OTP_IDENTIFIER_MISMATCH_CODE = "identifier_mismatch";
