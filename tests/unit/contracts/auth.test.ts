import { describe, expect, it } from "vitest";

import {
  PhoneStartSchema,
  PhoneVerifySchema,
} from "../../../packages/contracts/src/auth";

describe("phone authentication contracts", () => {
  it("requires a normalized Indian E.164 number", () => {
    expect(PhoneStartSchema.safeParse({ phoneNumber: "+919876543210" }).success).toBe(
      true,
    );
    expect(PhoneStartSchema.safeParse({ phoneNumber: "9876543210" }).success).toBe(
      false,
    );
  });

  it("keeps OTP verification tied to a challenge and numeric code", () => {
    expect(
      PhoneVerifySchema.safeParse({
        challengeId: "4f9d4891-157f-49ed-aa5a-c026abc0a768",
        phoneNumber: "+919876543210",
        otp: "12ab56",
      }).success,
    ).toBe(false);
  });
});
