import {
  RESEND_CONCURRENT_IDEMPOTENCY_ERROR,
  RESEND_HTTP_CONFLICT,
  RESEND_HTTP_RATE_LIMITED,
  RESEND_HTTP_REQUEST_TIMEOUT,
  RESEND_HTTP_SERVER_ERROR_MINIMUM,
} from "./email-delivery.constants";

export function resendFailureIsRetryable(
  status: number,
  errorName: string | undefined,
): boolean {
  return (
    status === RESEND_HTTP_REQUEST_TIMEOUT ||
    status === RESEND_HTTP_RATE_LIMITED ||
    status >= RESEND_HTTP_SERVER_ERROR_MINIMUM ||
    (status === RESEND_HTTP_CONFLICT &&
      errorName === RESEND_CONCURRENT_IDEMPOTENCY_ERROR)
  );
}
