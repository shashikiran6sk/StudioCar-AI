import { PhoneOtpErrorCategory } from "./phone-otp-error.types";

export const PHONE_OTP_INVALID_OTP_MESSAGE =
  "The verification code you entered is incorrect. Please try again.";
export const PHONE_OTP_EXPIRED_MESSAGE =
  "This verification code has expired. Request a new code to continue.";
export const PHONE_OTP_TOO_MANY_ATTEMPTS_MESSAGE =
  "Too many incorrect verification attempts. Please request a new code and try again.";
export const PHONE_OTP_RATE_LIMITED_MESSAGE =
  "Too many OTP requests. Please wait before requesting another code.";
export const PHONE_OTP_SESSION_EXPIRED_MESSAGE =
  "This verification session has ended. Request a new code to continue.";
export const PHONE_OTP_INVALID_REQUEST_MESSAGE =
  "We couldn't process that verification request. Request a new code and try again.";
export const PHONE_OTP_VERIFY_UNAVAILABLE_MESSAGE =
  "We couldn't verify your code right now. Please try again.";
export const PHONE_OTP_DELIVERY_UNAVAILABLE_MESSAGE =
  "We couldn't send a verification code right now. Please try again.";
export const PHONE_OTP_UNKNOWN_PROVIDER_MESSAGE =
  "Verification didn't complete. Request a new code and try again.";

/**
 * Categories whose provider verification request can no longer succeed, so
 * the next resend has to start a new request instead of retrying this one.
 */
export const PHONE_OTP_TERMINAL_CATEGORIES: ReadonlySet<PhoneOtpErrorCategory> =
  new Set([
    PhoneOtpErrorCategory.OtpExpired,
    PhoneOtpErrorCategory.TooManyAttempts,
    PhoneOtpErrorCategory.OtpSessionExpired,
  ]);

/**
 * Categories caused by the provider being unreachable. Only these may be
 * described to a person as the service being unavailable.
 */
export const PHONE_OTP_AVAILABILITY_CATEGORIES: ReadonlySet<PhoneOtpErrorCategory> =
  new Set([
    PhoneOtpErrorCategory.NetworkError,
    PhoneOtpErrorCategory.ServiceUnavailable,
  ]);
