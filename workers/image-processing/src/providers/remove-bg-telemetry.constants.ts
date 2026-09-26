export const REMOVE_BG_METRICS = {
  request: "removebg.request.count",
  success: "removebg.success.count",
  failure: "removebg.failure.count",
  duration: "removebg.duration",
  clientError: "removebg.status.4xx",
  serverError: "removebg.status.5xx",
  credits: "removebg.credits.charged",
  unreportedCredits: "removebg.success.unreported_credits.count",
};
export const REMOVE_BG_MONITORED_STATUSES = [400, 401, 402, 403, 429, 500];
export const REMOVE_BG_CREDITS_HEADER = "x-credits-charged";
