import { afterEach, describe, expect, it, vi } from "vitest";

import { getVerifiedPhoneForBrowser } from "../../../../../apps/web/src/server/auth/phone/get-verified-phone-for-browser";
import { getPhoneAccountService } from "../../../../../apps/web/src/server/auth/phone/phone-auth-runtime";
import { PhoneAccountService } from "../../../../../apps/web/src/server/auth/phone/phone-account-service";

const { cookieValues } = vi.hoisted(() => ({
  cookieValues: new Map<string, string>(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) => {
      const value = cookieValues.get(name);
      return value === undefined ? undefined : { value };
    },
  })),
}));
vi.mock("../../../../../apps/web/src/server/auth/phone/phone-auth-runtime", () => ({
  getPhoneAccountService: vi.fn(),
}));

describe("getVerifiedPhoneForBrowser", () => {
  afterEach(() => {
    cookieValues.clear();
    vi.clearAllMocks();
  });

  it("does not query account state without both browser-bound cookies", async () => {
    await expect(getVerifiedPhoneForBrowser()).resolves.toBeNull();
    expect(getPhoneAccountService).not.toHaveBeenCalled();
  });

  it("loads the verified phone from the server instead of client input", async () => {
    const challengeId = "4f9d4891-157f-49ed-aa5a-c026abc0a768";
    cookieValues.set("studiocar_verified_phone", `account_setup_${challengeId}`);
    cookieValues.set("studiocar_phone_otp", "binding");
    const findVerified = vi.fn(async () => ({
      phoneNumber: "+919876543210",
      expiresAt: new Date("2026-09-24T12:10:00.000Z"),
    }));
    vi.mocked(getPhoneAccountService).mockReturnValue(
      new PhoneAccountService(
        { findVerified, createAccount: vi.fn() },
        { prepareIssue: vi.fn() },
      ),
    );

    await expect(getVerifiedPhoneForBrowser()).resolves.toBe("+919876543210");
    expect(findVerified).toHaveBeenCalledWith(
      expect.objectContaining({ challengeId }),
    );
  });
});
