import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { retryMsg91Otp } from "../../../../../apps/web/src/features/auth/msg91-widget/retry-msg91-otp";
import { PhoneOtpErrorCategory } from "../../../../../apps/web/src/features/auth/phone-otp-error/phone-otp-error.types";
import { MSG91_RETRY_WAIT, MSG91_SEND_SUCCESS } from "./msg91-fixtures";

beforeEach(() => {
  window.sendOtp = vi.fn((_identifier, success) => success?.(undefined));
  window.verifyOtp = vi.fn();
});

afterEach(() => {
  delete window.sendOtp;
  delete window.retryOtp;
  delete window.verifyOtp;
});

describe("retryMsg91Otp", () => {
  it("resends the existing request on the chosen channel", async () => {
    window.retryOtp = vi.fn((_channel, success) =>
      success?.(MSG91_SEND_SUCCESS),
    );

    await expect(retryMsg91Otp("req-1", "11")).resolves.toBe(
      MSG91_SEND_SUCCESS.message,
    );
    expect(window.retryOtp).toHaveBeenCalledWith(
      "11",
      expect.any(Function),
      expect.any(Function),
      "req-1",
    );
    expect(window.sendOtp).not.toHaveBeenCalled();
  });

  it("keeps the current request id when the widget reports none", async () => {
    window.retryOtp = vi.fn((_channel, success) => success?.(undefined));

    await expect(retryMsg91Otp("req-1", null)).resolves.toBe("req-1");
  });

  it("lets the widget use its own request id when none is known", async () => {
    window.retryOtp = vi.fn((_channel, success) => success?.(undefined));

    await retryMsg91Otp(null, "11");

    expect(window.retryOtp).toHaveBeenCalledWith(
      "11",
      expect.any(Function),
      expect.any(Function),
      undefined,
    );
  });

  it("reports the provider's resend wait instead of sending a new code", async () => {
    window.retryOtp = vi.fn((_channel, _success, failure) =>
      failure?.(MSG91_RETRY_WAIT),
    );

    await expect(retryMsg91Otp("req-1", "11")).rejects.toMatchObject({
      category: PhoneOtpErrorCategory.RateLimited,
      retryAfterSeconds: 41,
    });
    expect(window.sendOtp).not.toHaveBeenCalled();
  });

  it("reports the widget refusing a missing channel as an invalid request", async () => {
    window.retryOtp = vi.fn(() => {
      throw new Error("Channel not provided in retryOtp() method.");
    });

    await expect(retryMsg91Otp("req-1", null)).rejects.toMatchObject({
      category: PhoneOtpErrorCategory.InvalidRequest,
    });
    expect(window.sendOtp).not.toHaveBeenCalled();
  });
});
