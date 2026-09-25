import {
  PHONE_OTP_FALLBACK_MAX_LENGTH,
  PHONE_OTP_FALLBACK_MIN_LENGTH,
} from "./phone-sign-in.constants";

/**
 * A code is complete when it has exactly the length the widget is configured
 * for. When the widget did not report a length, any length the provider can
 * issue is accepted rather than assuming one.
 */
export function isCompleteOtpCode(
  code: string,
  expectedLength: number | null,
): boolean {
  if (!/^\d+$/.test(code)) return false;
  return expectedLength === null
    ? code.length >= PHONE_OTP_FALLBACK_MIN_LENGTH &&
        code.length <= PHONE_OTP_FALLBACK_MAX_LENGTH
    : code.length === expectedLength;
}
