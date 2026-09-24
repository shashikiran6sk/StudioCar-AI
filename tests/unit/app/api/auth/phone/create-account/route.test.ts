import { describe, expect, it, vi } from "vitest";

import { POST } from "../../../../../../../apps/web/src/app/api/auth/phone/create-account/route";
import { getPhoneAccountService } from "../../../../../../../apps/web/src/server/auth/phone/phone-auth-runtime";
import { PhoneAccountService } from "../../../../../../../apps/web/src/server/auth/phone/phone-account-service";
import type { PhoneAccountRepositoryPort } from "../../../../../../../apps/web/src/server/auth/phone/phone-account.types";

vi.mock("../../../../../../../apps/web/src/server/auth/phone/phone-auth-runtime", () => ({
  getPhoneAccountService: vi.fn(),
}));

describe("POST /api/auth/phone/create-account", () => {
  it("delegates to the phone account service", async () => {
    const service = new PhoneAccountService(
      {
        createAccount: vi.fn<PhoneAccountRepositoryPort["createAccount"]>(
          async () => ({ kind: "PHONE_TAKEN" }),
        ),
        findVerified: vi.fn(async () => null),
      },
      { prepareIssue: vi.fn(() => ({
        token: "t".repeat(43),
        tokenHash: "h".repeat(64),
        expiresAt: new Date("2026-10-24T12:00:00.000Z"),
      })) },
    );
    vi.mocked(getPhoneAccountService).mockReturnValue(service);
    const response = await POST(
      new Request("https://app.studiocar.test/api/auth/phone/create-account", {
        method: "POST",
        headers: {
          origin: "https://app.studiocar.test",
          cookie: `studiocar_verified_phone=account_setup_4f9d4891-157f-49ed-aa5a-c026abc0a768; studiocar_phone_otp=binding`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ displayName: "Shashi Kiran" }),
      }),
    );
    expect(response.status).toBe(409);
  });
});
