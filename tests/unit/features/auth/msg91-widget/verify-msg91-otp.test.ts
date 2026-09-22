import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { verifyMsg91Otp } from "../../../../../apps/web/src/features/auth/msg91-widget/verify-msg91-otp";

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
      success?.({ message: "signed.access.token" }),
    );

    await expect(verifyMsg91Otp("123456")).resolves.toBe("signed.access.token");
    expect(window.verifyOtp).toHaveBeenCalledWith(
      "123456",
      expect.any(Function),
      expect.any(Function),
    );
  });

  it("refuses a success that carries no token", async () => {
    window.verifyOtp = vi.fn((_code, success) => success?.({ ok: true }));

    await expect(verifyMsg91Otp("123456")).rejects.toThrow(
      "The verification service returned no access token.",
    );
  });

  it("propagates a wrong-code refusal", async () => {
    window.verifyOtp = vi.fn((_code, _success, failure) =>
      failure?.(new Error("invalid otp")),
    );

    await expect(verifyMsg91Otp("000000")).rejects.toThrow("invalid otp");
  });
});
