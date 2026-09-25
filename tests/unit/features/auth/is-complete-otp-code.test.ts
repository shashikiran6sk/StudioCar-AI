import { describe, expect, it } from "vitest";

import { isCompleteOtpCode } from "../../../../apps/web/src/features/auth/is-complete-otp-code";

describe("isCompleteOtpCode", () => {
  it("requires exactly the configured length", () => {
    expect(isCompleteOtpCode("123456", 6)).toBe(true);
    expect(isCompleteOtpCode("12345", 6)).toBe(false);
    expect(isCompleteOtpCode("1234567", 6)).toBe(false);
  });

  it("refuses anything but digits", () => {
    expect(isCompleteOtpCode("12a456", 6)).toBe(false);
    expect(isCompleteOtpCode("", 6)).toBe(false);
  });

  it("accepts any issuable length when the widget reported none", () => {
    expect(isCompleteOtpCode("1234", null)).toBe(true);
    expect(isCompleteOtpCode("12345678", null)).toBe(true);
    expect(isCompleteOtpCode("123", null)).toBe(false);
    expect(isCompleteOtpCode("123456789", null)).toBe(false);
  });
});
