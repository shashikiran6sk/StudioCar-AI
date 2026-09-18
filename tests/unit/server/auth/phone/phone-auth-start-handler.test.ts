import { describe, expect, it, vi } from "vitest";

import { handlePhoneAuthStart } from "../../../../../apps/web/src/server/auth/phone/phone-auth-start-handler";
import type { PhoneOtpApplication } from "../../../../../apps/web/src/server/auth/phone/phone-auth.types";
import {
  PhoneOtpApplicationError,
  PhoneOtpApplicationErrorCode,
} from "../../../../../apps/web/src/server/auth/phone/phone-otp-service";

const endpoint = "https://app.studiocar.test/api/auth/phone/start";

function application(): PhoneOtpApplication {
  return {
    start: vi.fn(async () => ({
      challengeId: "4f9d4891-157f-49ed-aa5a-c026abc0a768",
      expiresAt: new Date("2026-09-18T12:10:00.000Z"),
      browserBinding: "b".repeat(43),
    })),
    verify: vi.fn(),
  };
}

function request(body: unknown, origin = "https://app.studiocar.test"): Request {
  return new Request(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin,
      "x-vercel-forwarded-for": "203.0.113.10",
    },
    body: JSON.stringify(body),
  });
}

describe("handlePhoneAuthStart", () => {
  it("normalizes input, starts a challenge, and binds it to an HttpOnly cookie", async () => {
    const auth = application();
    const response = await handlePhoneAuthStart(
      request({ phoneNumber: "98765 43210" }),
      auth,
      true,
    );

    expect(response.status).toBe(201);
    expect(auth.start).toHaveBeenCalledWith(
      { phoneNumber: "+919876543210" },
      "203.0.113.10",
    );
    expect(response.headers.get("set-cookie")).toContain(
      "__Host-studiocar_phone_otp=",
    );
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  });

  it("rejects cross-origin and invalid requests before application work", async () => {
    const auth = application();
    const crossOrigin = await handlePhoneAuthStart(
      request({ phoneNumber: "+919876543210" }, "https://attacker.test"),
      auth,
      false,
      () => "request-1",
    );
    const invalid = await handlePhoneAuthStart(
      request({ phoneNumber: "invalid" }),
      auth,
      false,
      () => "request-2",
    );

    expect(crossOrigin.status).toBe(403);
    expect(invalid.status).toBe(400);
    expect(auth.start).not.toHaveBeenCalled();
  });

  it("maps application rate limits without leaking internals", async () => {
    const auth = application();
    vi.mocked(auth.start).mockRejectedValue(
      new PhoneOtpApplicationError(
        PhoneOtpApplicationErrorCode.RateLimited,
        60,
      ),
    );

    const response = await handlePhoneAuthStart(
      request({ phoneNumber: "+919876543210" }),
      auth,
      false,
      () => "request-3",
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("60");
  });
});
