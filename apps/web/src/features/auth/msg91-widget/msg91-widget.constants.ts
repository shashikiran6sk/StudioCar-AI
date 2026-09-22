export const MSG91_WIDGET_SCRIPT_SRC = "https://verify.msg91.com/otp-provider.js";
export const MSG91_WIDGET_SCRIPT_ID = "msg91-otp-provider";
export const MSG91_WIDGET_READY_TIMEOUT_MS = 15_000;
export const MSG91_WIDGET_CALL_TIMEOUT_MS = 20_000;
export const MSG91_WIDGET_POLL_INTERVAL_MS = 50;

export const MSG91_WIDGET_LOAD_ERROR =
  "The verification service could not be loaded.";
export const MSG91_WIDGET_STARTUP_ERROR =
  "The verification service did not finish starting up. Check that this domain is allow-listed on the MSG91 widget.";
export const MSG91_WIDGET_NO_TOKEN_ERROR =
  "The verification service returned no access token.";
export const MSG91_WIDGET_UNAVAILABLE_ERROR =
  "The verification service is not available on this page.";

export const MSG91_ACCESS_TOKEN_KEYS: readonly string[] = [
  "message",
  "accessToken",
  "access-token",
  "token",
  "jwt",
];
