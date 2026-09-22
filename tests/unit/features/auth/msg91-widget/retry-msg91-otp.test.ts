import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { retryMsg91Otp } from "../../../../../apps/web/src/features/auth/msg91-widget/retry-msg91-otp";

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
  it("uses the widget's own resend when it is configured", async () => {
    window.retryOtp = vi.fn((_channel, success) => success?.(undefined));

    await expect(retryMsg91Otp("919876543210")).resolves.toBeUndefined();
    expect(window.retryOtp).toHaveBeenCalled();
    expect(window.sendOtp).not.toHaveBeenCalled();
  });

  it("falls back to a fresh send when no retry channel is configured", async () => {
    window.retryOtp = vi.fn((_channel, _success, failure) =>
      failure?.(new Error("no retry channel")),
    );

    await expect(retryMsg91Otp("919876543210")).resolves.toBeUndefined();
    expect(window.sendOtp).toHaveBeenCalledWith(
      "919876543210",
      expect.any(Function),
      expect.any(Function),
    );
  });
});
