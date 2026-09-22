import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { sendMsg91Otp } from "../../../../../apps/web/src/features/auth/msg91-widget/send-msg91-otp";

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
  it("asks the widget to send to the supplied identifier", async () => {
    window.sendOtp = vi.fn((_identifier, success) => success?.(undefined));

    await expect(sendMsg91Otp("919876543210")).resolves.toBeUndefined();
    expect(window.sendOtp).toHaveBeenCalledWith(
      "919876543210",
      expect.any(Function),
      expect.any(Function),
    );
  });

  it("propagates a refusal from the widget", async () => {
    window.sendOtp = vi.fn((_identifier, _success, failure) =>
      failure?.(new Error("blocked")),
    );

    await expect(sendMsg91Otp("919876543210")).rejects.toThrow("blocked");
  });
});
