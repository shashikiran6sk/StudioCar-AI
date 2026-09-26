import { ApplicationErrorCode } from "@studiocar/observability";

export function classifyRemoveBgError(
  statusCode: number | undefined,
): ApplicationErrorCode {
  if (statusCode === 401 || statusCode === 403)
    return ApplicationErrorCode.REMOVE_BG_UNAUTHORIZED;
  if (statusCode === 402)
    return ApplicationErrorCode.REMOVE_BG_PAYMENT_REQUIRED;
  if (statusCode === 429) return ApplicationErrorCode.REMOVE_BG_RATE_LIMIT;
  if (statusCode !== undefined && statusCode >= 500)
    return ApplicationErrorCode.REMOVE_BG_SERVER_ERROR;
  return ApplicationErrorCode.REMOVE_BG_FAILED;
}
