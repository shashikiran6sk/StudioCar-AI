import {
  PhoneOtpErrorCategory,
  PhoneOtpOperation,
} from "../phone-otp-error/phone-otp-error.types";
import type { Msg91WidgetMethod } from "./msg91-widget.types";

export const MSG91_ERROR_TYPE = "error";
export const MSG91_FAIL_STATUS = "fail";

/**
 * MSG91 widget refusal codes, recorded from live `control.msg91.com/api/v5/
 * widget/*` responses on 2026-09-25. MSG91 publishes no error table for these
 * endpoints, so only observed codes are mapped; anything else is reported as
 * an unknown provider error rather than guessed at.
 *
 * - 704 on verify: "verification limit exceeded" — the fourth and every later
 *   verify against one request id after three wrong codes.
 * - 704 on retry: "wait N seconds to retry." — inside the widget's configured
 *   resend delay. The same code means different things per operation.
 * - 705: "invalid otp".
 * - 708: "error fetching records" — a malformed request id.
 * - 709: "no request found" — the request id does not (or no longer) exist.
 */
export const MSG91_CODE_CATEGORIES: Readonly<
  Record<Msg91WidgetMethod, ReadonlyMap<number, PhoneOtpErrorCategory>>
> = {
  sendOtp: new Map([[708, PhoneOtpErrorCategory.InvalidRequest]]),
  retryOtp: new Map([
    [704, PhoneOtpErrorCategory.RateLimited],
    [708, PhoneOtpErrorCategory.InvalidRequest],
    [709, PhoneOtpErrorCategory.OtpSessionExpired],
  ]),
  verifyOtp: new Map([
    [704, PhoneOtpErrorCategory.TooManyAttempts],
    [705, PhoneOtpErrorCategory.InvalidOtp],
    [708, PhoneOtpErrorCategory.InvalidRequest],
    [709, PhoneOtpErrorCategory.OtpSessionExpired],
  ]),
};

export const MSG91_METHOD_OPERATIONS: Readonly<
  Record<Msg91WidgetMethod, PhoneOtpOperation>
> = {
  sendOtp: PhoneOtpOperation.Send,
  retryOtp: PhoneOtpOperation.Resend,
  verifyOtp: PhoneOtpOperation.Verify,
};

/**
 * The resend refusal states its own wait ("wait 41 seconds to retry."). The
 * code classifies the refusal; this only reads the provider's wait from it.
 */
export const MSG91_RETRY_AFTER_PATTERN = /(\d+)\s*seconds?/i;
export const MSG91_NUMERIC_CODE_PATTERN = /^\d+$/;
