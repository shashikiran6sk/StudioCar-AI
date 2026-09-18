import { randomUUID } from "node:crypto";

import { createApiErrorResponse } from "../create-api-error-response";
import {
  API_BAD_REQUEST_CODE,
  API_CONFLICT_CODE,
  API_RATE_LIMITED_CODE,
  API_SERVICE_UNAVAILABLE_CODE,
  HTTP_BAD_REQUEST_STATUS,
  HTTP_CONFLICT_STATUS,
  HTTP_SERVICE_UNAVAILABLE_STATUS,
  HTTP_TOO_MANY_REQUESTS_STATUS,
  IDENTITY_LINK_REQUIRED_MESSAGE,
  INVALID_CHALLENGE_MESSAGE,
  INVALID_OTP_MESSAGE,
  PROVIDER_UNAVAILABLE_MESSAGE,
  RATE_LIMITED_MESSAGE,
} from "./phone-auth.constants";
import {
  PhoneOtpApplicationError,
  PhoneOtpApplicationErrorCode,
} from "./phone-otp-service";

export function createPhoneAuthErrorResponse(
  error: PhoneOtpApplicationError,
  createRequestId: () => string = randomUUID,
): Response {
  if (error.code === PhoneOtpApplicationErrorCode.RateLimited) {
    const retry = error.retryAfterSeconds
      ? { retryAfterSeconds: error.retryAfterSeconds }
      : {};
    return createApiErrorResponse({
      status: HTTP_TOO_MANY_REQUESTS_STATUS,
      code: API_RATE_LIMITED_CODE,
      message: RATE_LIMITED_MESSAGE,
      requestId: createRequestId(),
      ...retry,
    });
  }

  if (error.code === PhoneOtpApplicationErrorCode.IdentityLinkRequired) {
    return createApiErrorResponse({
      status: HTTP_CONFLICT_STATUS,
      code: API_CONFLICT_CODE,
      message: IDENTITY_LINK_REQUIRED_MESSAGE,
      requestId: createRequestId(),
    });
  }

  if (error.code === PhoneOtpApplicationErrorCode.ProviderUnavailable) {
    return createApiErrorResponse({
      status: HTTP_SERVICE_UNAVAILABLE_STATUS,
      code: API_SERVICE_UNAVAILABLE_CODE,
      message: PROVIDER_UNAVAILABLE_MESSAGE,
      requestId: createRequestId(),
    });
  }

  const message =
    error.code === PhoneOtpApplicationErrorCode.InvalidOtp
      ? INVALID_OTP_MESSAGE
      : INVALID_CHALLENGE_MESSAGE;
  return createApiErrorResponse({
    status: HTTP_BAD_REQUEST_STATUS,
    code: API_BAD_REQUEST_CODE,
    message,
    requestId: createRequestId(),
  });
}
