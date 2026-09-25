import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { sendMsg91Otp } from "../../../../../apps/web/src/features/auth/msg91-widget/send-msg91-otp";
import { PhoneOtpErrorCategory } from "../../../../../apps/web/src/features/auth/phone-otp-error/phone-otp-error.types";
import { MSG91_SEND_SUCCESS, MSG91_TRANSPORT_FAILURE } from "./msg91-fixtures";

beforeEach(() => {
  window.retryOtp = vi.fn();
  window.verifyOtp = vi.fn();
});

afterEach(() => {
  delete window.sendOtp;
  delete window.retryOtp;
  delete window.verifyOtp;
});

describe("sendMsg91Otp", () => {
  it("sends to the identifier and resolves with the provider request id", async () => {
    window.sendOtp = vi.fn((_identifier, success) =>
      success?.(MSG91_SEND_SUCCESS),
    );

    await expect(sendMsg91Otp("919876543210")).resolves.toBe(
      MSG91_SEND_SUCCESS.message,
    );
    expect(window.sendOtp).toHaveBeenCalledWith(
      "919876543210",
      expect.any(Function),
      expect.any(Function),
    );
  });

  it("resolves null when the widget reports no request id", async () => {
    window.sendOtp = vi.fn((_identifier, success) => success?.(undefined));

    await expect(sendMsg91Otp("919876543210")).resolves.toBeNull();
  });

  it("normalizes a refusal", async () => {
    window.sendOtp = vi.fn((_identifier, _success, failure) =>
      failure?.(MSG91_TRANSPORT_FAILURE),
    );

    await expect(sendMsg91Otp("919876543210")).rejects.toMatchObject({
      category: PhoneOtpErrorCategory.NetworkError,
    });
  });
});
