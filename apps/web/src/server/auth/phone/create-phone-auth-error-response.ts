import { randomUUID } from "node:crypto";
import type { ApiErrorCode } from "@studiocar/contracts";

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
  OTP_EXPIRED_MESSAGE,
  PROVIDER_UNAVAILABLE_MESSAGE,
  RATE_LIMITED_MESSAGE,
  SERVICE_UNAVAILABLE_MESSAGE,
  TOO_MANY_ATTEMPTS_MESSAGE,
  VERIFICATION_RATE_LIMITED_MESSAGE,
} from "./phone-auth.constants";
import {
  PhoneOtpApplicationError,
  PhoneOtpApplicationErrorCode,
} from "./phone-otp-service";

interface PhoneAuthErrorShape {
  status: number;
  code: ApiErrorCode;
  message: string;
}

/**
 * One distinct, person-readable answer per failure. Only a provider or
 * service outage is described as unavailable; a refused, expired or locked
 * code never is.
 */
const ERROR_SHAPES: Readonly<
  Record<PhoneOtpApplicationErrorCode, PhoneAuthErrorShape>
> = {
  [PhoneOtpApplicationErrorCode.RateLimited]: {
    status: HTTP_TOO_MANY_REQUESTS_STATUS,
    code: API_RATE_LIMITED_CODE,
    message: RATE_LIMITED_MESSAGE,
  },
  [PhoneOtpApplicationErrorCode.VerificationRateLimited]: {
    status: HTTP_TOO_MANY_REQUESTS_STATUS,
    code: API_RATE_LIMITED_CODE,
    message: VERIFICATION_RATE_LIMITED_MESSAGE,
  },
  [PhoneOtpApplicationErrorCode.TooManyAttempts]: {
    status: HTTP_TOO_MANY_REQUESTS_STATUS,
    code: API_RATE_LIMITED_CODE,
    message: TOO_MANY_ATTEMPTS_MESSAGE,
  },
  [PhoneOtpApplicationErrorCode.InvalidOtp]: {
    status: HTTP_BAD_REQUEST_STATUS,
    code: API_BAD_REQUEST_CODE,
    message: INVALID_OTP_MESSAGE,
  },
  [PhoneOtpApplicationErrorCode.Expired]: {
    status: HTTP_BAD_REQUEST_STATUS,
    code: API_BAD_REQUEST_CODE,
    message: OTP_EXPIRED_MESSAGE,
  },
  [PhoneOtpApplicationErrorCode.InvalidChallenge]: {
    status: HTTP_BAD_REQUEST_STATUS,
    code: API_BAD_REQUEST_CODE,
    message: INVALID_CHALLENGE_MESSAGE,
  },
  [PhoneOtpApplicationErrorCode.IdentityLinkRequired]: {
    status: HTTP_CONFLICT_STATUS,
    code: API_CONFLICT_CODE,
    message: IDENTITY_LINK_REQUIRED_MESSAGE,
  },
  [PhoneOtpApplicationErrorCode.ProviderUnavailable]: {
    status: HTTP_SERVICE_UNAVAILABLE_STATUS,
    code: API_SERVICE_UNAVAILABLE_CODE,
    message: PROVIDER_UNAVAILABLE_MESSAGE,
  },
  [PhoneOtpApplicationErrorCode.ServiceUnavailable]: {
    status: HTTP_SERVICE_UNAVAILABLE_STATUS,
    code: API_SERVICE_UNAVAILABLE_CODE,
    message: SERVICE_UNAVAILABLE_MESSAGE,
  },
};

export function createPhoneAuthErrorResponse(
  error: PhoneOtpApplicationError,
  createRequestId: () => string = randomUUID,
): Response {
  const retry =
    error.retryAfterSeconds &&
    ERROR_SHAPES[error.code].status === HTTP_TOO_MANY_REQUESTS_STATUS
      ? { retryAfterSeconds: error.retryAfterSeconds }
      : {};
  return createApiErrorResponse({
    ...ERROR_SHAPES[error.code],
    requestId: createRequestId(),
    ...retry,
  });
}
