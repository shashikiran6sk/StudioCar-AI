import { describe, expect, it, vi } from "vitest";

import { handlePhoneAuthVerify } from "../../../../../apps/web/src/server/auth/phone/phone-auth-verify-handler";
import type { PhoneOtpApplication } from "../../../../../apps/web/src/server/auth/phone/phone-auth.types";

const endpoint = "https://app.studiocar.test/api/auth/phone/verify";
const challengeId = "4f9d4891-157f-49ed-aa5a-c026abc0a768";
const browserBinding = "b".repeat(43);

function application(): PhoneOtpApplication {
  return {
    start: vi.fn(),
    verify: vi.fn(async () => ({
      token: "t".repeat(43),
      expiresAt: new Date("2026-10-18T12:00:00.000Z"),
      session: {
        id: "session-1",
        userId: "user-1",
        expiresAt: new Date("2026-10-18T12:00:00.000Z"),
        user: {
          id: "user-1",
          displayName: null,
          primaryEmail: null,
          primaryPhone: "+919876543210",
        },
      },
      user: {
        id: "user-1",
        displayName: null,
        primaryEmail: null,
        primaryPhone: "+919876543210",
      },
    })),
  };
}

function request(includeBinding = true): Request {
  return new Request(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://app.studiocar.test",
      ...(includeBinding
        ? { cookie: `studiocar_phone_otp=${browserBinding}` }
        : {}),
    },
    body: JSON.stringify({
      challengeId,
      phoneNumber: "+919876543210",
      accessToken: "signed.widget.access-token",
    }),
  });
}

describe("handlePhoneAuthVerify", () => {
  it("sets the opaque session and clears the browser-binding cookie", async () => {
    const auth = application();
    const response = await handlePhoneAuthVerify(request(), auth, false);
    const setCookie = response.headers.get("set-cookie") ?? "";

    expect(response.status).toBe(200);
    expect(auth.verify).toHaveBeenCalledWith(
      {
        challengeId,
        phoneNumber: "+919876543210",
        accessToken: "signed.widget.access-token",
      },
      browserBinding,
      "unknown",
    );
    expect(setCookie).toContain("studiocar_session=tttt");
    expect(setCookie).toContain("studiocar_phone_otp=");
  });

  it("rejects challenges not bound to the requesting browser", async () => {
    const auth = application();
    const response = await handlePhoneAuthVerify(
      request(false),
      auth,
      false,
      () => "request-1",
    );

    expect(response.status).toBe(400);
    expect(auth.verify).not.toHaveBeenCalled();
  });
});
