import { describe, expect, it } from "vitest";

import { maskPhoneNumber } from "../../../../apps/web/src/features/auth/mask-phone-number";

describe("maskPhoneNumber", () => {
  it("keeps the country code and last four digits", () => {
    expect(maskPhoneNumber("+919876543210")).toBe("+91 ******3210");
  });

  it("ignores formatting", () => {
    expect(maskPhoneNumber("+91 98765 43210")).toBe("+91 ******3210");
  });

  it("masks a number without a country code", () => {
    expect(maskPhoneNumber("9876543210")).toBe("******3210");
  });

  it("never reveals more than the last four digits", () => {
    expect(maskPhoneNumber("123")).toBe("123");
    expect(maskPhoneNumber("+919876543210")).not.toContain("98765");
  });
});
