import { describe, expect, it } from "vitest";

import {
  clearPhoneOtpCookie,
  createPhoneOtpCookie,
  phoneOtpCookieName,
} from "../../../../../apps/web/src/server/auth/phone/phone-otp-cookie";

describe("phone OTP browser-binding cookie", () => {
  it("uses the __Host prefix and secure attributes in production", () => {
    const expires = new Date("2026-09-18T12:10:00.000Z");
    expect(createPhoneOtpCookie("binding", expires, true)).toEqual({
      name: "__Host-studiocar_phone_otp",
      value: "binding",
      options: {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        expires,
      },
    });
  });

  it("clears the active environment-specific cookie", () => {
    expect(phoneOtpCookieName(false)).toBe("studiocar_phone_otp");
    expect(clearPhoneOtpCookie(false).options.expires).toEqual(new Date(0));
  });
});
