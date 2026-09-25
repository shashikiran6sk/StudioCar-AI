import { describe, expect, it } from "vitest";

import { toOtpDigits } from "../../../../apps/web/src/features/auth/to-otp-digits";

describe("toOtpDigits", () => {
  it("keeps digits only", () => {
    expect(toOtpDigits("12a3-4 5", 6)).toBe("12345");
  });

  it("extracts a pasted code", () => {
    expect(toOtpDigits("Code: 123 456", 6)).toBe("123456");
  });

  it("caps the code at its length", () => {
    expect(toOtpDigits("12345678", 6)).toBe("123456");
  });
});
