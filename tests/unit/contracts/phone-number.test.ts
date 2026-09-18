import { describe, expect, it } from "vitest";

import {
  IndianPhoneNumberSchema,
  normalizeIndianPhoneNumber,
} from "../../../packages/contracts/src/phone-number";

describe("Indian phone normalization", () => {
  it.each([
    ["9876543210", "+919876543210"],
    ["919876543210", "+919876543210"],
    ["+91 (98765) 43210", "+919876543210"],
    ["09876543210", "+919876543210"],
    ["9123456789", "+919123456789"],
  ])("normalizes %s", (input, expected) => {
    expect(normalizeIndianPhoneNumber(input)).toBe(expected);
    expect(IndianPhoneNumberSchema.parse(input)).toBe(expected);
  });

  it("rejects invalid country codes and mobile prefixes", () => {
    expect(IndianPhoneNumberSchema.safeParse("+449876543210").success).toBe(false);
    expect(IndianPhoneNumberSchema.safeParse("+915876543210").success).toBe(false);
  });
});
