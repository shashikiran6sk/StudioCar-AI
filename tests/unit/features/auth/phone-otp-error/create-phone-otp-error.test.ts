import { describe, expect, it } from "vitest";

import { createPhoneOtpError } from "../../../../../apps/web/src/features/auth/phone-otp-error/create-phone-otp-error";
import {
  PhoneOtpErrorCategory,
  PhoneOtpOperation,
} from "../../../../../apps/web/src/features/auth/phone-otp-error/phone-otp-error.types";

describe("createPhoneOtpError", () => {
  it.each([
    [
      PhoneOtpErrorCategory.InvalidOtp,
      "The verification code you entered is incorrect. Please try again.",
    ],
    [
      PhoneOtpErrorCategory.OtpExpired,
      "This verification code has expired. Request a new code to continue.",
    ],
    [
      PhoneOtpErrorCategory.TooManyAttempts,
      "Too many incorrect verification attempts. Please request a new code and try again.",
    ],
    [
      PhoneOtpErrorCategory.RateLimited,
      "Too many OTP requests. Please wait before requesting another code.",
    ],
    [
      PhoneOtpErrorCategory.ServiceUnavailable,
      "We couldn't verify your code right now. Please try again.",
    ],
  ])("describes %s for a person", (category, message) => {
    expect(createPhoneOtpError(category, PhoneOtpOperation.Verify).message).toBe(
      message,
    );
  });

  it("uses the availability message only for availability failures", () => {
    const notOutages = Object.values(PhoneOtpErrorCategory).filter(
      (category) =>
        category !== PhoneOtpErrorCategory.NetworkError &&
        category !== PhoneOtpErrorCategory.ServiceUnavailable,
    );
    for (const category of notOutages) {
      expect(
        createPhoneOtpError(category, PhoneOtpOperation.Verify).message,
      ).not.toMatch(/right now|not available|unavailable/);
    }
  });

  it("says a code could not be sent when sending was unreachable", () => {
    expect(
      createPhoneOtpError(
        PhoneOtpErrorCategory.NetworkError,
        PhoneOtpOperation.Resend,
      ).message,
    ).toBe("We couldn't send a verification code right now. Please try again.");
  });

  it("carries provider details", () => {
    expect(
      createPhoneOtpError(
        PhoneOtpErrorCategory.RateLimited,
        PhoneOtpOperation.Resend,
        { providerCode: 704, retryAfterSeconds: 41 },
      ),
    ).toMatchObject({
      category: PhoneOtpErrorCategory.RateLimited,
      operation: PhoneOtpOperation.Resend,
      providerCode: 704,
      retryAfterSeconds: 41,
    });
  });
});
