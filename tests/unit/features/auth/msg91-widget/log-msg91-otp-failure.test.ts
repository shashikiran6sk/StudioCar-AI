import { describe, expect, it, vi } from "vitest";

import { logMsg91OtpFailure } from "../../../../../apps/web/src/features/auth/msg91-widget/log-msg91-otp-failure";
import { normalizeMsg91OtpError } from "../../../../../apps/web/src/features/auth/msg91-widget/normalize-msg91-otp-error";
import { MSG91_INVALID_OTP, MSG91_TRANSPORT_FAILURE } from "./msg91-fixtures";

describe("logMsg91OtpFailure", () => {
  it("records the provider's classification and request id", () => {
    const sink = vi.fn();
    const error = normalizeMsg91OtpError("verifyOtp", MSG91_INVALID_OTP);

    logMsg91OtpFailure("verifyOtp", error, MSG91_INVALID_OTP, "req-1", sink, false);

    expect(sink).toHaveBeenCalledWith("MSG91 OTP widget call failed", {
      method: "verifyOtp",
      category: "INVALID_OTP",
      providerCode: 705,
      providerType: "error",
      providerStatus: null,
      providerMessage: "invalid otp",
      transportFailure: false,
      requestId: "req-1",
    });
  });

  it("copies only classification fields, never other payload values", () => {
    const sink = vi.fn();
    const failure = {
      ...MSG91_INVALID_OTP,
      otp: "123456",
      "access-token": "signed.token",
      tokenAuth: "widget-token",
    };
    const error = normalizeMsg91OtpError("verifyOtp", failure);

    logMsg91OtpFailure("verifyOtp", error, failure, null, sink, false);

    const logged = JSON.stringify(sink.mock.calls);
    expect(logged).not.toContain("123456");
    expect(logged).not.toContain("signed.token");
    expect(logged).not.toContain("widget-token");
  });

  it("flags a transport failure", () => {
    const sink = vi.fn();
    const error = normalizeMsg91OtpError("sendOtp", MSG91_TRANSPORT_FAILURE);

    logMsg91OtpFailure("sendOtp", error, MSG91_TRANSPORT_FAILURE, null, sink, false);

    expect(sink).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        category: "NETWORK_ERROR",
        transportFailure: true,
        providerMessage: null,
      }),
    );
  });

  it("logs nothing in production", () => {
    const sink = vi.fn();
    const error = normalizeMsg91OtpError("verifyOtp", MSG91_INVALID_OTP);

    logMsg91OtpFailure("verifyOtp", error, MSG91_INVALID_OTP, "req-1", sink, true);

    expect(sink).not.toHaveBeenCalled();
  });
});
