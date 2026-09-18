import { describe, expect, it } from "vitest";

import {
  clearSessionCookie,
  createSessionCookie,
} from "../../../../apps/web/src/server/auth/session-cookie";

describe("session cookies", () => {
  it("uses the __Host prefix and Secure flag in production", () => {
    const expires = new Date("2026-10-18T12:00:00.000Z");

    expect(createSessionCookie("opaque-token", expires, true)).toEqual({
      name: "__Host-studiocar_session",
      value: "opaque-token",
      options: {
        expires,
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        secure: true,
      },
    });
  });

  it("allows local HTTP development and expires logout cookies", () => {
    expect(createSessionCookie("opaque-token", new Date(), false).options.secure).toBe(
      false,
    );
    expect(clearSessionCookie(false)).toMatchObject({
      name: "studiocar_session",
      value: "",
      options: { expires: new Date(0) },
    });
  });
});
