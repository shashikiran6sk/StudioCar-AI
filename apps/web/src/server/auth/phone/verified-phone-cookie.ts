import type { PhoneOtpCookie } from "./phone-otp-cookie";
import { EntityIdSchema } from "@studiocar/contracts";

const PRODUCTION_VERIFIED_PHONE_COOKIE_NAME =
  "__Host-studiocar_verified_phone";
const DEVELOPMENT_VERIFIED_PHONE_COOKIE_NAME = "studiocar_verified_phone";
const VERIFIED_PHONE_ACCOUNT_SETUP_PURPOSE = "account_setup_";

export function verifiedPhoneCookieName(isProduction: boolean): string {
  return isProduction
    ? PRODUCTION_VERIFIED_PHONE_COOKIE_NAME
    : DEVELOPMENT_VERIFIED_PHONE_COOKIE_NAME;
}

export function createVerifiedPhoneCookie(
  challengeId: string,
  expires: Date,
  isProduction: boolean,
): PhoneOtpCookie {
  return {
    name: verifiedPhoneCookieName(isProduction),
    value: challengeId
      ? `${VERIFIED_PHONE_ACCOUNT_SETUP_PURPOSE}${challengeId}`
      : "",
    options: {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      expires,
    },
  };
}

export function readVerifiedPhoneChallengeId(value: string | undefined): string | null {
  if (!value?.startsWith(VERIFIED_PHONE_ACCOUNT_SETUP_PURPOSE)) return null;
  const candidate = value.slice(VERIFIED_PHONE_ACCOUNT_SETUP_PURPOSE.length);
  const parsed = EntityIdSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

export function clearVerifiedPhoneCookie(isProduction: boolean): PhoneOtpCookie {
  return createVerifiedPhoneCookie("", new Date(0), isProduction);
}
