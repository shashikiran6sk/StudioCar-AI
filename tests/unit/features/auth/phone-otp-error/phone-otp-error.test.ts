import { describe, expect, it } from "vitest";

import { PhoneOtpError } from "../../../../../apps/web/src/features/auth/phone-otp-error/phone-otp-error";
import {
  PhoneOtpErrorCategory,
  PhoneOtpOperation,
} from "../../../../../apps/web/src/features/auth/phone-otp-error/phone-otp-error.types";

describe("PhoneOtpError", () => {
  it("is an Error carrying its category, operation and provider details", () => {
    const error = new PhoneOtpError(
      PhoneOtpErrorCategory.InvalidOtp,
      PhoneOtpOperation.Verify,
      "Try again.",
      { providerCode: 705 },
    );

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("PhoneOtpError");
    expect(error.message).toBe("Try again.");
    expect(error.providerCode).toBe(705);
    expect(error.retryAfterSeconds).toBeUndefined();
  });
});
