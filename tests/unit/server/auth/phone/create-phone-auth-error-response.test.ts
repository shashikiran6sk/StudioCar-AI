import { describe, expect, it } from "vitest";

import { createPhoneAuthErrorResponse } from "../../../../../apps/web/src/server/auth/phone/create-phone-auth-error-response";
import {
  PhoneOtpApplicationError,
  PhoneOtpApplicationErrorCode,
} from "../../../../../apps/web/src/server/auth/phone/phone-otp-service";

describe("createPhoneAuthErrorResponse", () => {
  it("returns a stable rate-limit envelope and Retry-After", async () => {
    const response = createPhoneAuthErrorResponse(
      new PhoneOtpApplicationError(
        PhoneOtpApplicationErrorCode.RateLimited,
        42,
      ),
      () => "request-1",
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("42");
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "RATE_LIMITED", requestId: "request-1" },
    });
  });

  it("does not expose provider failures", async () => {
    const response = createPhoneAuthErrorResponse(
      new PhoneOtpApplicationError(
        PhoneOtpApplicationErrorCode.ProviderUnavailable,
        undefined,
        { cause: new Error("secret provider response") },
      ),
      () => "request-2",
    );

    expect(response.status).toBe(503);
    expect(JSON.stringify(await response.json())).not.toContain("secret provider");
  });
});
