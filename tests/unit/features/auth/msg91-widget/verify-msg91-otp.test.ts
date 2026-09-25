import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { verifyMsg91Otp } from "../../../../../apps/web/src/features/auth/msg91-widget/verify-msg91-otp";
import { PhoneOtpErrorCategory } from "../../../../../apps/web/src/features/auth/phone-otp-error/phone-otp-error.types";
import {
  MSG91_INVALID_OTP,
  MSG91_TRANSPORT_FAILURE,
  MSG91_VERIFICATION_LIMIT,
} from "./msg91-fixtures";

beforeEach(() => {
  window.sendOtp = vi.fn();
  window.retryOtp = vi.fn();
});

afterEach(() => {
  delete window.sendOtp;
  delete window.retryOtp;
  delete window.verifyOtp;
});

describe("verifyMsg91Otp", () => {
  it("exchanges the typed code for the provider's access token", async () => {
    window.verifyOtp = vi.fn((_code, success) =>
      success?.({ type: "success", message: "signed.access.token" }),
    );

    await expect(verifyMsg91Otp("123456", "req-1")).resolves.toBe(
      "signed.access.token",
    );
    expect(window.verifyOtp).toHaveBeenCalledWith(
      "123456",
      expect.any(Function),
      expect.any(Function),
      "req-1",
    );
  });

  it("refuses a success that carries no token", async () => {
    window.verifyOtp = vi.fn((_code, success) => success?.({ ok: true }));

    await expect(verifyMsg91Otp("123456", null)).rejects.toMatchObject({
      category: PhoneOtpErrorCategory.UnknownProviderError,
    });
  });

  it("reports MSG91's wrong-code refusal as INVALID_OTP, not an outage", async () => {
    window.verifyOtp = vi.fn((_code, _success, failure) =>
      failure?.(MSG91_INVALID_OTP),
    );

    const refusal = verifyMsg91Otp("000000", "req-1");
    await expect(refusal).rejects.toMatchObject({
      category: PhoneOtpErrorCategory.InvalidOtp,
      message:
        "The verification code you entered is incorrect. Please try again.",
    });
    await expect(refusal).rejects.not.toThrow(/not available/);
  });

  it("reports the attempt limit as TOO_MANY_ATTEMPTS", async () => {
    window.verifyOtp = vi.fn((_code, _success, failure) =>
      failure?.(MSG91_VERIFICATION_LIMIT),
    );

    await expect(verifyMsg91Otp("000000", "req-1")).rejects.toMatchObject({
      category: PhoneOtpErrorCategory.TooManyAttempts,
    });
  });

  it("reports a failed request as a network error", async () => {
    window.verifyOtp = vi.fn((_code, _success, failure) =>
      failure?.(MSG91_TRANSPORT_FAILURE),
    );

    await expect(verifyMsg91Otp("123456", "req-1")).rejects.toMatchObject({
      category: PhoneOtpErrorCategory.NetworkError,
    });
  });
});
