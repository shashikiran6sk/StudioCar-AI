export const REQUEST_ID_HEADER = "x-request-id";
export const SAFE_IDENTIFIER_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;
export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const HTTP_SERVICE = "nextjs-api";
export const WORKER_SERVICE = "image-processing-worker";
export const METRIC_TIMEOUT_MS = 1000;
export const SENTRY_FLUSH_TIMEOUT_MS = 2000;
export const SAFE_ERROR_MESSAGE = "Unexpected application failure";
export const MAXIMUM_STACK_FRAMES = 30;
export const REMOVE_BG_PAYMENT_REQUIRED_MESSAGE =
  "remove.bg has insufficient credits (HTTP 402 Payment Required).";
export const HTTP_ERROR_MESSAGES: Readonly<Record<string, string>> = {
  REMOVE_BG_PAYMENT_REQUIRED: REMOVE_BG_PAYMENT_REQUIRED_MESSAGE,
  PROVIDER_PAYMENT_REQUIRED:
    "The background-removal provider has insufficient credits.",
  REMOVE_BG_UNAUTHORIZED:
    "remove.bg rejected the server credentials or permissions.",
  REMOVE_BG_RATE_LIMIT: "remove.bg rate limited the request.",
  REMOVE_BG_SERVER_ERROR: "remove.bg returned a server error.",
  UNAUTHORIZED: "Authentication required",
  UNAUTHENTICATED: "Authentication required",
  FORBIDDEN: "Request forbidden",
  VALIDATION_FAILED: "Request validation failed",
  BAD_REQUEST: "Request validation failed",
};
export enum ApplicationErrorCode {
  INTERNAL_ERROR = "INTERNAL_ERROR",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  VALIDATION_FAILED = "VALIDATION_FAILED",
  SQS_JOB_FAILED = "SQS_JOB_FAILED",
  IMAGE_PROCESSING_FAILED = "IMAGE_PROCESSING_FAILED",
  REMOVE_BG_FAILED = "REMOVE_BG_FAILED",
  REMOVE_BG_UNAUTHORIZED = "REMOVE_BG_UNAUTHORIZED",
  REMOVE_BG_PAYMENT_REQUIRED = "REMOVE_BG_PAYMENT_REQUIRED",
  REMOVE_BG_RATE_LIMIT = "REMOVE_BG_RATE_LIMIT",
  REMOVE_BG_SERVER_ERROR = "REMOVE_BG_SERVER_ERROR",
  S3_UPLOAD_FAILED = "S3_UPLOAD_FAILED",
}

export const LOG_EVENTS = {
  HTTP_COMPLETED: "http_request_completed",
  HTTP_METRICS_FAILED: "http_metrics_publish_failed",
  HTTP_CONFIGURATION_FAILED: "http_metrics_configuration_failed",
  JOB_RESERVED: "processing_job_reserved",
  JOB_PUBLISHED: "sqs_job_published",
  JOB_RECEIVED: "job_received",
  JOB_IGNORED: "job_ignored",
  PROCESSING_STARTED: "image_processing_started",
  PROCESSING_COMPLETED: "image_processing_completed",
  PROCESSING_FAILED: "image_processing_failed",
  PROVIDER_REUSED: "provider_result_reused",
  REMOVE_BG_STARTED: "remove_bg_started",
  REMOVE_BG_COMPLETED: "remove_bg_completed",
  REMOVE_BG_FAILED: "remove_bg_failed",
  S3_UPLOAD_COMPLETED: "s3_upload_completed",
  S3_UPLOAD_FAILED: "s3_upload_failed",
  UNEXPECTED_EXCEPTION: "unexpected_exception",
};
export const HTTP_METRICS = {
  REQUESTS: "HttpRequests",
  SUCCESS: "Http2xx",
  UNAUTHORIZED: "Http401",
  FORBIDDEN: "Http403",
  CLIENT_ERROR: "Http4xx",
  SERVER_ERROR: "Http5xx",
  DURATION: "HttpDuration",
};
export const SAFE_ROUTE_PATTERN = /^\/(?:[A-Za-z0-9_()[\]-]+\/?)*$/;
