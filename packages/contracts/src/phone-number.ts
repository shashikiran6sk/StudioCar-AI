import { z } from "zod";

const INDIAN_COUNTRY_CODE = "91";
const INDIAN_TRUNK_PREFIX = "0";
const INDIAN_MOBILE_PATTERN = /^[6-9]\d{9}$/;
const PHONE_NUMBER_FORMATTING_PATTERN = /[\s()-]/g;
const INVALID_PHONE_NUMBER = "";
const NATIONAL_NUMBER_LENGTH = 10;
const COUNTRY_CODE_NUMBER_LENGTH = 12;
const TRUNK_PREFIX_NUMBER_LENGTH = 11;
export const INDIAN_PHONE_NUMBER_ERROR =
  "Enter a valid Indian mobile number.";

export function normalizeIndianPhoneNumber(value: string): string {
  const compact = value.trim().replace(PHONE_NUMBER_FORMATTING_PATTERN, "");
  const withoutPlus = compact.startsWith("+") ? compact.slice(1) : compact;
  const nationalNumber =
    withoutPlus.length === COUNTRY_CODE_NUMBER_LENGTH &&
    withoutPlus.startsWith(INDIAN_COUNTRY_CODE)
    ? withoutPlus.slice(INDIAN_COUNTRY_CODE.length)
    : withoutPlus.length === TRUNK_PREFIX_NUMBER_LENGTH &&
        withoutPlus.startsWith(INDIAN_TRUNK_PREFIX)
      ? withoutPlus.slice(INDIAN_TRUNK_PREFIX.length)
      : withoutPlus.length === NATIONAL_NUMBER_LENGTH
        ? withoutPlus
        : INVALID_PHONE_NUMBER;

  return INDIAN_MOBILE_PATTERN.test(nationalNumber)
    ? `+${INDIAN_COUNTRY_CODE}${nationalNumber}`
    : INVALID_PHONE_NUMBER;
}

export const IndianPhoneNumberSchema = z.preprocess(
  (value) => (typeof value === "string" ? normalizeIndianPhoneNumber(value) : value),
  z.string().regex(/^\+91[6-9]\d{9}$/, INDIAN_PHONE_NUMBER_ERROR),
);
