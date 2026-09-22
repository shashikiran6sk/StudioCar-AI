export const RESEND_EMAIL_ENDPOINT = "https://api.resend.com/emails";
export const RESEND_AUTHORIZATION_SCHEME = "Bearer";
export const RESEND_IDEMPOTENCY_HEADER = "Idempotency-Key";
export const RESEND_CONTENT_TYPE = "application/json";
export const RESEND_CONCURRENT_IDEMPOTENCY_ERROR =
  "concurrent_idempotent_requests";
export const RESEND_HTTP_REQUEST_TIMEOUT = 408;
export const RESEND_HTTP_CONFLICT = 409;
export const RESEND_HTTP_RATE_LIMITED = 429;
export const RESEND_HTTP_SERVER_ERROR_MINIMUM = 500;
export const RESEND_NETWORK_ERROR = "RESEND_NETWORK_ERROR";
export const RESEND_INVALID_RESPONSE = "RESEND_INVALID_RESPONSE";
export const EMAIL_PROCESSING_COMPLETE_SUBJECT = "Your StudioCar images are ready";
export const EMAIL_PROCESSING_COMPLETE_ACTION = "Open vehicle portfolio";
export const EMAIL_PROCESSING_COMPLETE_INTRO =
  "Background processing is complete for";
export const EMAIL_PROCESSING_COMPLETE_FOOTER =
  "Your original images remain preserved in StudioCar AI.";

export const MAILPIT_SEND_PATH = "/api/v1/send";
export const MAILPIT_CONTENT_TYPE = "application/json";
export const MAILPIT_NETWORK_ERROR = "mailpit_unreachable";
export const MAILPIT_INVALID_RESPONSE = "mailpit_invalid_response";
