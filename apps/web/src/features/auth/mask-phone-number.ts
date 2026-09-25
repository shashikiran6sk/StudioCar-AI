import {
  PHONE_MASK_CHARACTER,
  PHONE_MASK_VISIBLE_DIGITS,
  PHONE_MASK_COUNTRY_CODE_PATTERN,
} from "./phone-sign-in.constants";

/**
 * Hides all but the last few digits of a number, keeping the country code, so
 * a person can recognise their own handset without the full number being
 * displayed or written to a log: `+919876543210` → `+91 ******3210`.
 */
export function maskPhoneNumber(phoneNumber: string): string {
  const compact = phoneNumber.replace(/[^\d+]/g, "");
  const countryCode = compact.match(PHONE_MASK_COUNTRY_CODE_PATTERN)?.[0] ?? "";
  const national = compact.slice(countryCode.length).replace(/\D/g, "");
  const visible = national.slice(-PHONE_MASK_VISIBLE_DIGITS);
  const hidden = PHONE_MASK_CHARACTER.repeat(
    Math.max(0, national.length - visible.length),
  );
  return [countryCode, `${hidden}${visible}`].filter(Boolean).join(" ");
}
