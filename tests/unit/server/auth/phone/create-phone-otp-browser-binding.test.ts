import { describe, expect, it } from "vitest";

import { createPhoneOtpBrowserBinding } from "../../../../../apps/web/src/server/auth/phone/create-phone-otp-browser-binding";

describe("createPhoneOtpBrowserBinding", () => {
  it("creates URL-safe 256-bit browser binding secrets", () => {
    expect(createPhoneOtpBrowserBinding()).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });
});
