import { describe, expect, it } from "vitest";

import {
  clearGoogleOAuthCookie,
  createGoogleOAuthCookie,
} from "../../../../../apps/web/src/server/auth/google/google-oauth-cookie";

describe("Google OAuth cookies", () => {
  it("binds production flows to a short-lived secure HttpOnly cookie", () => {
    const expires = new Date("2026-09-18T12:10:00.000Z");

    expect(createGoogleOAuthCookie("oauth-state", expires, true)).toEqual({
      name: "__Host-studiocar_google_oauth",
      value: "oauth-state",
      options: {
        expires,
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        secure: true,
      },
    });
  });

  it("supports local HTTP and clears completed challenges", () => {
    expect(createGoogleOAuthCookie("oauth-state", new Date(), false).options.secure).toBe(
      false,
    );
    expect(clearGoogleOAuthCookie(false)).toMatchObject({
      name: "studiocar_google_oauth",
      value: "",
      options: { expires: new Date(0) },
    });
  });
});
