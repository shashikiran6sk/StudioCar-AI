import { describe, expect, it, vi } from "vitest";

import { TelemetryPhoneOtpVerificationObserver } from "../../../../../apps/web/src/server/auth/phone/telemetry-phone-otp-verification-observer";
import { PhoneOtpRefusalReason } from "../../../../../apps/web/src/server/auth/phone/phone-auth.types";

describe("TelemetryPhoneOtpVerificationObserver", () => {
  it("emits one bounded event per refusal", () => {
    const telemetry = { emit: vi.fn(() => true) };

    new TelemetryPhoneOtpVerificationObserver(telemetry, () => 1_000).verificationRefused(
      PhoneOtpRefusalReason.ProviderRejected,
    );

    expect(telemetry.emit).toHaveBeenCalledWith({
      eventName: "phone_otp_verification_refused",
      level: "WARN",
      service: "web-phone-auth",
      timestampMilliseconds: 1_000,
      dimensions: { Reason: "provider_rejected" },
      metrics: [{ name: "PhoneOtpVerificationRefused", unit: "Count", value: 1 }],
    });
  });

  it("carries no identifier, token or correlation data", () => {
    const telemetry = { emit: vi.fn(() => true) };

    new TelemetryPhoneOtpVerificationObserver(telemetry).verificationRefused(
      PhoneOtpRefusalReason.IdentifierMismatch,
    );

    const event = JSON.stringify(telemetry.emit.mock.calls);
    expect(event).not.toMatch(/\+?91\d{10}|token|authkey|correlation/i);
  });
});
