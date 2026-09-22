import type { ProviderMsisdn } from "./phone-auth.types";

const MSISDN_PATTERN = /^\d{8,15}$/;

/**
 * Providers name a handset as bare digits. Normalising both sides of the
 * comparison is what lets the verified identifier be checked against the
 * claimed E.164 number without trusting either format.
 */
export function toProviderMsisdn(value: unknown): ProviderMsisdn | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const digits = String(value).replace(/\s+/g, "").replace(/^\+/, "");
  return MSISDN_PATTERN.test(digits) ? digits : null;
}
