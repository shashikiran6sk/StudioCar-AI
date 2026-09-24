import { describe, expect, it } from "vitest";

import {
  clearVerifiedPhoneCookie,
  createVerifiedPhoneCookie,
  readVerifiedPhoneChallengeId,
  verifiedPhoneCookieName,
} from "../../../../../apps/web/src/server/auth/phone/verified-phone-cookie";

describe("verified phone cookie", () => {
  it("is short-lived, HttpOnly, host-only in production, and clearable", () => {
    const expiry = new Date("2026-09-24T12:10:00.000Z");
    expect(createVerifiedPhoneCookie("challenge-id", expiry, true)).toEqual({
      name: "__Host-studiocar_verified_phone",
      value: "account_setup_challenge-id",
      options: {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        expires: expiry,
      },
    });
    expect(verifiedPhoneCookieName(false)).toBe("studiocar_verified_phone");
    expect(clearVerifiedPhoneCookie(false).options.expires).toEqual(new Date(0));
    expect(readVerifiedPhoneChallengeId("other_purpose_challenge-id")).toBeNull();
    expect(readVerifiedPhoneChallengeId("account_setup_bad-id")).toBeNull();
  });
});
