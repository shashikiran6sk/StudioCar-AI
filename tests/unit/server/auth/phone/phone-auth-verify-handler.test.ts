import { describe, expect, it, vi } from "vitest";
import { PhoneAuthenticationStatus } from "../../../../../packages/contracts/src/auth";

import { handlePhoneAuthVerify } from "../../../../../apps/web/src/server/auth/phone/phone-auth-verify-handler";
import type { PhoneOtpApplication } from "../../../../../apps/web/src/server/auth/phone/phone-auth.types";

const endpoint = "https://app.studiocar.test/api/auth/phone/verify";
const challengeId = "4f9d4891-157f-49ed-aa5a-c026abc0a768";
const browserBinding = "b".repeat(43);

function application(): PhoneOtpApplication {
  return {
    start: vi.fn(),
    link: vi.fn(),
    verify: vi.fn<PhoneOtpApplication["verify"]>(async () => ({
      status: PhoneAuthenticationStatus.Authenticated,
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
  it("sets temporary verified-phone state without creating a session for a new phone", async () => {
    const auth = application();
    vi.mocked(auth.verify).mockResolvedValue({
      status: PhoneAuthenticationStatus.AccountSetupRequired,
      challengeId,
      expiresAt: new Date("2026-09-18T12:10:00.000Z"),
    });
    const response = await handlePhoneAuthVerify(request(), auth, false);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: "account_setup_required",
    });
    const cookies = response.headers.get("set-cookie") ?? "";
    expect(cookies).toContain(`studiocar_verified_phone=account_setup_${challengeId}`);
    expect(cookies).not.toContain("studiocar_session=");
  });

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
