/**
 * Provider responses recorded from live MSG91 widget calls on 2026-09-25
 * (request ids and identifiers replaced). The widget hands these bodies to
 * failure callbacks unchanged.
 */
export const MSG91_INVALID_OTP = {
  message: "invalid otp",
  type: "error",
  code: 705,
};
export const MSG91_VERIFICATION_LIMIT = {
  message: "verification limit exceeded",
  type: "error",
  code: 704,
};
export const MSG91_RETRY_WAIT = {
  message: "wait 41 seconds to retry.",
  type: "error",
  code: 704,
};
export const MSG91_NO_REQUEST = {
  message: "no request found",
  type: "error",
  code: 709,
};
export const MSG91_FETCH_ERROR = {
  message: "error fetching records",
  type: "error",
  code: 708,
};
export const MSG91_REQ_ID_REQUIRED = {
  message: "reqId is required.",
  type: "error",
  hasError: true,
  status: "fail",
};
/** What the widget passes when its HTTP request itself failed. */
export const MSG91_TRANSPORT_FAILURE = ["Something went wrong."];
export const MSG91_SEND_SUCCESS = {
  message: "36697969654e303536353038",
  type: "success",
};
