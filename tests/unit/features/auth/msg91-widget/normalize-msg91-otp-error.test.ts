import { describe, expect, it } from "vitest";

import { normalizeMsg91OtpError } from "../../../../../apps/web/src/features/auth/msg91-widget/normalize-msg91-otp-error";
import { createPhoneOtpError } from "../../../../../apps/web/src/features/auth/phone-otp-error/create-phone-otp-error";
import {
  PhoneOtpErrorCategory,
  PhoneOtpOperation,
} from "../../../../../apps/web/src/features/auth/phone-otp-error/phone-otp-error.types";
import {
  MSG91_FETCH_ERROR,
  MSG91_INVALID_OTP,
  MSG91_NO_REQUEST,
  MSG91_REQ_ID_REQUIRED,
  MSG91_RETRY_WAIT,
  MSG91_TRANSPORT_FAILURE,
  MSG91_VERIFICATION_LIMIT,
} from "./msg91-fixtures";

describe("normalizeMsg91OtpError", () => {
  it("maps a wrong code to INVALID_OTP with the incorrect-code message", () => {
    const error = normalizeMsg91OtpError("verifyOtp", MSG91_INVALID_OTP);

    expect(error.category).toBe(PhoneOtpErrorCategory.InvalidOtp);
    expect(error.providerCode).toBe(705);
    expect(error.message).toBe(
      "The verification code you entered is incorrect. Please try again.",
    );
  });

  it("maps the verify attempt limit to TOO_MANY_ATTEMPTS", () => {
    const error = normalizeMsg91OtpError("verifyOtp", MSG91_VERIFICATION_LIMIT);

    expect(error.category).toBe(PhoneOtpErrorCategory.TooManyAttempts);
    expect(error.message).toBe(
      "Too many incorrect verification attempts. Please request a new code and try again.",
    );
  });

  it("reads 704 on resend as a rate limit with the provider's wait", () => {
    const error = normalizeMsg91OtpError("retryOtp", MSG91_RETRY_WAIT);

    expect(error.category).toBe(PhoneOtpErrorCategory.RateLimited);
    expect(error.retryAfterSeconds).toBe(41);
    expect(error.operation).toBe(PhoneOtpOperation.Resend);
    expect(error.message).toBe(
      "Too many OTP requests. Please wait before requesting another code.",
    );
  });

  it("treats an unknown request id as an ended verification session", () => {
    expect(normalizeMsg91OtpError("verifyOtp", MSG91_NO_REQUEST).category).toBe(
      PhoneOtpErrorCategory.OtpSessionExpired,
    );
    expect(normalizeMsg91OtpError("retryOtp", MSG91_NO_REQUEST).category).toBe(
      PhoneOtpErrorCategory.OtpSessionExpired,
    );
  });

  it("treats malformed requests as INVALID_REQUEST", () => {
    expect(normalizeMsg91OtpError("verifyOtp", MSG91_FETCH_ERROR).category).toBe(
      PhoneOtpErrorCategory.InvalidRequest,
    );
    expect(
      normalizeMsg91OtpError("verifyOtp", MSG91_REQ_ID_REQUIRED).category,
    ).toBe(PhoneOtpErrorCategory.InvalidRequest);
    expect(
      normalizeMsg91OtpError("verifyOtp", {
        message: "OTP not provided in verifyOtp() method.",
      }).category,
    ).toBe(PhoneOtpErrorCategory.InvalidRequest);
    expect(
      normalizeMsg91OtpError(
        "retryOtp",
        new Error("Channel not provided in retryOtp() method."),
      ).category,
    ).toBe(PhoneOtpErrorCategory.InvalidRequest);
  });

  it("maps a failed HTTP request to NETWORK_ERROR, never to a code refusal", () => {
    const error = normalizeMsg91OtpError("verifyOtp", MSG91_TRANSPORT_FAILURE);

    expect(error.category).toBe(PhoneOtpErrorCategory.NetworkError);
    expect(error.message).toBe(
      "We couldn't verify your code right now. Please try again.",
    );
  });

  it("says a code could not be sent when sending is unreachable", () => {
    expect(
      normalizeMsg91OtpError("sendOtp", MSG91_TRANSPORT_FAILURE).message,
    ).toBe("We couldn't send a verification code right now. Please try again.");
  });

  it("does not guess at codes it has not observed", () => {
    const error = normalizeMsg91OtpError("verifyOtp", {
      type: "error",
      code: 799,
      message: "something new",
    });

    expect(error.category).toBe(PhoneOtpErrorCategory.UnknownProviderError);
    expect(error.providerCode).toBe(799);
    expect(error.message).not.toContain("something new");
  });

  it("accepts a numeric code sent as a string", () => {
    expect(
      normalizeMsg91OtpError("verifyOtp", { type: "error", code: "705" })
        .category,
    ).toBe(PhoneOtpErrorCategory.InvalidOtp);
  });

  it("reports unrecognisable failures as unknown", () => {
    expect(normalizeMsg91OtpError("verifyOtp", 42).category).toBe(
      PhoneOtpErrorCategory.UnknownProviderError,
    );
    expect(normalizeMsg91OtpError("verifyOtp", {}).category).toBe(
      PhoneOtpErrorCategory.UnknownProviderError,
    );
  });

  it("passes an already normalized error through unchanged", () => {
    const original = createPhoneOtpError(
      PhoneOtpErrorCategory.ServiceUnavailable,
      PhoneOtpOperation.Verify,
    );

    expect(normalizeMsg91OtpError("verifyOtp", original)).toBe(original);
  });
});
