import {
  PHONE_OTP_AVAILABILITY_CATEGORIES,
  PHONE_OTP_DELIVERY_UNAVAILABLE_MESSAGE,
  PHONE_OTP_EXPIRED_MESSAGE,
  PHONE_OTP_INVALID_OTP_MESSAGE,
  PHONE_OTP_INVALID_REQUEST_MESSAGE,
  PHONE_OTP_RATE_LIMITED_MESSAGE,
  PHONE_OTP_SESSION_EXPIRED_MESSAGE,
  PHONE_OTP_TOO_MANY_ATTEMPTS_MESSAGE,
  PHONE_OTP_UNKNOWN_PROVIDER_MESSAGE,
  PHONE_OTP_VERIFY_UNAVAILABLE_MESSAGE,
} from "./phone-otp-error.constants";
import { PhoneOtpError } from "./phone-otp-error";
import {
  PhoneOtpErrorCategory,
  PhoneOtpOperation,
  type PhoneOtpErrorDetails,
} from "./phone-otp-error.types";

const CATEGORY_MESSAGES: Readonly<Record<PhoneOtpErrorCategory, string>> = {
  [PhoneOtpErrorCategory.InvalidOtp]: PHONE_OTP_INVALID_OTP_MESSAGE,
  [PhoneOtpErrorCategory.OtpExpired]: PHONE_OTP_EXPIRED_MESSAGE,
  [PhoneOtpErrorCategory.TooManyAttempts]: PHONE_OTP_TOO_MANY_ATTEMPTS_MESSAGE,
  [PhoneOtpErrorCategory.RateLimited]: PHONE_OTP_RATE_LIMITED_MESSAGE,
  [PhoneOtpErrorCategory.OtpSessionExpired]: PHONE_OTP_SESSION_EXPIRED_MESSAGE,
  [PhoneOtpErrorCategory.InvalidRequest]: PHONE_OTP_INVALID_REQUEST_MESSAGE,
  [PhoneOtpErrorCategory.NetworkError]: PHONE_OTP_VERIFY_UNAVAILABLE_MESSAGE,
  [PhoneOtpErrorCategory.ServiceUnavailable]:
    PHONE_OTP_VERIFY_UNAVAILABLE_MESSAGE,
  [PhoneOtpErrorCategory.UnknownProviderError]:
    PHONE_OTP_UNKNOWN_PROVIDER_MESSAGE,
};

/**
 * Builds a failure with the message a person should see. Availability
 * failures while sending say a code could not be sent, not that one could not
 * be verified.
 */
export function createPhoneOtpError(
  category: PhoneOtpErrorCategory,
  operation: PhoneOtpOperation,
  details: PhoneOtpErrorDetails = {},
): PhoneOtpError {
  const message =
    PHONE_OTP_AVAILABILITY_CATEGORIES.has(category) &&
    operation !== PhoneOtpOperation.Verify
      ? PHONE_OTP_DELIVERY_UNAVAILABLE_MESSAGE
      : CATEGORY_MESSAGES[category];
  return new PhoneOtpError(category, operation, message, details);
}
