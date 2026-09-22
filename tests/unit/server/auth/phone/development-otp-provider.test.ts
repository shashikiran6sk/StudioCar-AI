import { describe, expect, it } from "vitest";

import { DevelopmentOtpProvider } from "../../../../../apps/web/src/server/auth/phone/development-otp-provider";
import { PhoneOtpIdentificationStatus } from "../../../../../apps/web/src/server/auth/phone/phone-auth.types";

const provider = new DevelopmentOtpProvider("1234");

describe("DevelopmentOtpProvider", () => {
  it("verifies a development token carrying the configured code", async () => {
    await expect(
      provider.identify("dev-otp:919876543210:1234"),
    ).resolves.toEqual({
      status: PhoneOtpIdentificationStatus.Verified,
      identifier: "919876543210",
    });
  });

  it("refuses a wrong code", async () => {
    await expect(
      provider.identify("dev-otp:919876543210:9999"),
    ).resolves.toEqual({ status: PhoneOtpIdentificationStatus.Rejected });
  });

  it("refuses a token that is not a development token", async () => {
    await expect(provider.identify("signed.jwt.token")).resolves.toEqual({
      status: PhoneOtpIdentificationStatus.Rejected,
    });
  });

  it("refuses a token with no usable identifier", async () => {
    await expect(provider.identify("dev-otp::1234")).resolves.toEqual({
      status: PhoneOtpIdentificationStatus.Rejected,
    });
  });
});
