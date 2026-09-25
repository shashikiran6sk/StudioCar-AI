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

  it.each([
    [PhoneOtpApplicationErrorCode.InvalidOtp, 400, "The verification code you entered is incorrect. Please try again."],
    [PhoneOtpApplicationErrorCode.Expired, 400, "This verification code has expired. Request a new code to continue."],
    [PhoneOtpApplicationErrorCode.TooManyAttempts, 429, "Too many incorrect verification attempts. Please request a new code and try again."],
    [PhoneOtpApplicationErrorCode.RateLimited, 429, "Too many OTP requests. Please wait before requesting another code."],
    [PhoneOtpApplicationErrorCode.VerificationRateLimited, 429, "Too many verification attempts. Please try again later."],
    [PhoneOtpApplicationErrorCode.InvalidChallenge, 400, "This verification session has ended. Request a new code to continue."],
    [PhoneOtpApplicationErrorCode.ProviderUnavailable, 503, "We couldn't verify your code right now. Please try again."],
    [PhoneOtpApplicationErrorCode.ServiceUnavailable, 503, "Phone verification is temporarily unavailable. Please try again."],
  ])("answers %s distinctly", async (code, status, message) => {
    const response = createPhoneAuthErrorResponse(
      new PhoneOtpApplicationError(code),
      () => "request-3",
    );

    expect(response.status).toBe(status);
    await expect(response.json()).resolves.toMatchObject({ error: { message } });
  });

  it("never describes a refused code as an outage", async () => {
    for (const code of [
      PhoneOtpApplicationErrorCode.InvalidOtp,
      PhoneOtpApplicationErrorCode.Expired,
      PhoneOtpApplicationErrorCode.TooManyAttempts,
      PhoneOtpApplicationErrorCode.RateLimited,
    ]) {
      const body = JSON.stringify(
        await createPhoneAuthErrorResponse(new PhoneOtpApplicationError(code)).json(),
      );
      expect(body).not.toMatch(/unavailable|right now/);
    }
  });
});
