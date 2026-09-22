import { AccountLookupSchema, type AccountLookup } from "@studiocar/contracts";

/**
 * Reads a lookup as either an email address or a mobile number.
 *
 * One field accepts both, because an administrator holding somebody's contact
 * details should not have to know which sign-in method they happened to use.
 */
export function parseAccountLookup(value: string): AccountLookup | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;

  const candidate = trimmed.includes("@")
    ? { email: trimmed }
    : { phoneNumber: trimmed };
  const parsed = AccountLookupSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}
