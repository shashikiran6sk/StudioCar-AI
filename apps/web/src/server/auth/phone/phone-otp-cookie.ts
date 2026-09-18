export interface PhoneOtpCookieOptions {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
  expires: Date;
}

export interface PhoneOtpCookie {
  name: string;
  value: string;
  options: PhoneOtpCookieOptions;
}

const PRODUCTION_PHONE_OTP_COOKIE_NAME = "__Host-studiocar_phone_otp";
const DEVELOPMENT_PHONE_OTP_COOKIE_NAME = "studiocar_phone_otp";
const COOKIE_PATH = "/";
const COOKIE_SAME_SITE = "lax";

export function phoneOtpCookieName(isProduction: boolean): string {
  return isProduction
    ? PRODUCTION_PHONE_OTP_COOKIE_NAME
    : DEVELOPMENT_PHONE_OTP_COOKIE_NAME;
}

export function createPhoneOtpCookie(
  browserBinding: string,
  expires: Date,
  isProduction: boolean,
): PhoneOtpCookie {
  return {
    name: phoneOtpCookieName(isProduction),
    value: browserBinding,
    options: {
      httpOnly: true,
      secure: isProduction,
      sameSite: COOKIE_SAME_SITE,
      path: COOKIE_PATH,
      expires,
    },
  };
}

export function clearPhoneOtpCookie(isProduction: boolean): PhoneOtpCookie {
  return createPhoneOtpCookie("", new Date(0), isProduction);
}
