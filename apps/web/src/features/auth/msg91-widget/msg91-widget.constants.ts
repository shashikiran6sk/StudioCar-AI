export const MSG91_WIDGET_SCRIPT_SRC = "https://verify.msg91.com/otp-provider.js";
export const MSG91_WIDGET_SCRIPT_ID = "msg91-otp-provider";
export const MSG91_WIDGET_READY_TIMEOUT_MS = 15_000;
export const MSG91_WIDGET_CALL_TIMEOUT_MS = 20_000;
export const MSG91_WIDGET_POLL_INTERVAL_MS = 50;

export const MSG91_WIDGET_LOAD_ERROR =
  "The verification service could not be loaded.";
export const MSG91_WIDGET_STARTUP_ERROR =
  "The verification service did not finish starting up. Check that this domain is allow-listed on the MSG91 widget.";
export const MSG91_OTP_FAILURE_LOG_MESSAGE = "MSG91 OTP widget call failed";

/**
 * `getWidgetData().widgetType.value` for a widget configured as Custom. The
 * provider script requires an explicit channel for `retryOtp` on these, and
 * throws when it is `null`.
 */
export const MSG91_CUSTOM_WIDGET_TYPE = "2";
/** `processes[].processVia.value` for a resend (retry) process. */
export const MSG91_RETRY_PROCESS_VIA = "5";
/** `processes[].channel.value` and `retryOtp` channel for SMS. */
export const MSG91_SMS_CHANNEL = "11";

export const MSG91_ACCESS_TOKEN_KEYS: readonly string[] = [
  "message",
  "accessToken",
  "access-token",
  "token",
  "jwt",
];
