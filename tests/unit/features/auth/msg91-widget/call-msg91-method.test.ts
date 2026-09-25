import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { callMsg91Method } from "../../../../../apps/web/src/features/auth/msg91-widget/call-msg91-method";
import { PhoneOtpError } from "../../../../../apps/web/src/features/auth/phone-otp-error/phone-otp-error";
import { PhoneOtpErrorCategory } from "../../../../../apps/web/src/features/auth/phone-otp-error/phone-otp-error.types";
import { MSG91_INVALID_OTP } from "./msg91-fixtures";

function exposeMethods(): void {
  window.sendOtp = vi.fn();
  window.retryOtp = vi.fn();
  window.verifyOtp = vi.fn();
}

beforeEach(() => {
  exposeMethods();
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

afterEach(() => {
  delete window.sendOtp;
  delete window.retryOtp;
  delete window.verifyOtp;
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("callMsg91Method", () => {
  it("resolves with the value the widget reports", async () => {
    await expect(
      callMsg91Method<string>("sendOtp", (resolve) => {
        resolve("done");
      }),
    ).resolves.toBe("done");
  });

  it("normalizes the provider's refusal instead of calling it an outage", async () => {
    const refusal = callMsg91Method<string>("verifyOtp", (_resolve, reject) => {
      reject(MSG91_INVALID_OTP);
    });

    await expect(refusal).rejects.toBeInstanceOf(PhoneOtpError);
    await expect(refusal).rejects.toMatchObject({
      category: PhoneOtpErrorCategory.InvalidOtp,
    });
  });

  it("logs a refusal with its request id in development", async () => {
    await callMsg91Method<string>(
      "verifyOtp",
      (_resolve, reject) => {
        reject(MSG91_INVALID_OTP);
      },
      { requestId: "req-1" },
    ).catch(() => undefined);

    expect(console.warn).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ category: "INVALID_OTP", requestId: "req-1" }),
    );
  });

  it("settles once even when the widget answers twice", async () => {
    await expect(
      callMsg91Method<string>("sendOtp", (resolve, reject) => {
        resolve("first");
        reject(new Error("late failure"));
      }),
    ).resolves.toBe("first");
  });

  it("reports the service unavailable when the widget never answers", async () => {
    vi.useFakeTimers();
    const pending = callMsg91Method<string>("sendOtp", () => undefined, {
      timeoutMs: 500,
    });
    const assertion = expect(pending).rejects.toMatchObject({
      category: PhoneOtpErrorCategory.ServiceUnavailable,
    });
    await vi.advanceTimersByTimeAsync(600);
    await assertion;
  });

  it("reports the service unavailable when the widget never exposed the method", async () => {
    delete window.verifyOtp;
    vi.useFakeTimers();
    const pending = callMsg91Method<string>("verifyOtp", () => undefined, {
      timeoutMs: 60_000,
    });
    const assertion = expect(pending).rejects.toMatchObject({
      category: PhoneOtpErrorCategory.ServiceUnavailable,
    });
    await vi.advanceTimersByTimeAsync(16_000);
    await assertion;
  });

  it("normalizes an error the widget throws synchronously", async () => {
    await expect(
      callMsg91Method<string>("retryOtp", () => {
        throw new Error("Channel not provided in retryOtp() method.");
      }),
    ).rejects.toMatchObject({ category: PhoneOtpErrorCategory.InvalidRequest });
  });
});
