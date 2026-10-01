import type { ProviderFailureCategory } from "./provider-failure.types";

/** The failure category of an unsuccessful provider HTTP status. */
export function classifyProviderStatus(
  status: number,
): ProviderFailureCategory {
  if (status === 401 || status === 403) return "AUTHORIZATION";
  if (status === 402) return "PAYMENT_REQUIRED";
  if (status === 408) return "TIMEOUT";
  if (status === 429) return "RATE_LIMITED";
  if (status >= 500) return "SERVER_ERROR";
  return "REJECTED";
}
