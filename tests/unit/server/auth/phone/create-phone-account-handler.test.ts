import { describe, expect, it, vi } from "vitest";

import { handleCreatePhoneAccount } from "../../../../../apps/web/src/server/auth/phone/create-phone-account-handler";
import type { PhoneAccountService } from "../../../../../apps/web/src/server/auth/phone/phone-account-service";

const ENDPOINT = "https://app.studiocar.test/api/auth/phone/create-account";
const CHALLENGE_ID = "4f9d4891-157f-49ed-aa5a-c026abc0a768";
const BINDING = "browser-secret";

function accountService(): Pick<PhoneAccountService, "createAccount"> {
  return {
    createAccount: vi.fn<PhoneAccountService["createAccount"]>(async () => ({
      kind: "CREATED",
      issuedSession: {
        token: "t".repeat(43),
        expiresAt: new Date("2026-10-24T12:00:00.000Z"),
        session: {
          id: "session-1",
          userId: "user-1",
          expiresAt: new Date("2026-10-24T12:00:00.000Z"),
          user: {
            id: "user-1",
            displayName: "Shashi Kiran",
            primaryEmail: null,
            primaryPhone: "+919876543210",
          },
        },
      },
    })),
  };
}

function request(
  body: unknown = { displayName: "Shashi Kiran" },
  cookie = `studiocar_verified_phone=account_setup_${CHALLENGE_ID}; studiocar_phone_otp=${BINDING}`,
): Request {
  return new Request(ENDPOINT, {
    method: "POST",
    headers: {
      origin: "https://app.studiocar.test",
      "content-type": "application/json",
      cookie,
    },
    body: JSON.stringify(body),
  });
}

describe("handleCreatePhoneAccount", () => {
  it("creates a session using only the server-bound phone proof", async () => {
    const accounts = accountService();
    const response = await handleCreatePhoneAccount(request(), accounts, false);
    expect(response.status).toBe(200);
    expect(accounts.createAccount).toHaveBeenCalledWith(
      CHALLENGE_ID,
      BINDING,
      { displayName: "Shashi Kiran" },
    );
    const cookies = response.headers.get("set-cookie") ?? "";
    expect(cookies).toContain("studiocar_session=tttt");
    expect(cookies).toContain("studiocar_phone_otp=");
    expect(cookies).toContain("studiocar_verified_phone=");
  });

  it("rejects forged phone fields and invalid names", async () => {
    const accounts = accountService();
    const forged = await handleCreatePhoneAccount(
      request({ displayName: "Shashi Kiran", phoneNumber: "+919999999999" }),
      accounts,
      false,
    );
    const invalidName = await handleCreatePhoneAccount(
      request({ displayName: "A" }),
      accounts,
      false,
    );
    expect(forged.status).toBe(400);
    expect(invalidName.status).toBe(400);
    expect(accounts.createAccount).not.toHaveBeenCalled();
  });

  it("requires both HttpOnly proof cookies and same origin", async () => {
    const accounts = accountService();
    const missing = await handleCreatePhoneAccount(request(undefined, ""), accounts, false);
    const crossOrigin = await handleCreatePhoneAccount(
      new Request(ENDPOINT, {
        method: "POST",
        headers: { origin: "https://attacker.test" },
        body: JSON.stringify({ displayName: "Shashi Kiran" }),
      }),
      accounts,
      false,
    );
    expect(missing.status).toBe(400);
    expect(crossOrigin.status).toBe(403);
    expect(accounts.createAccount).not.toHaveBeenCalled();
  });

  it.each<["INVALID_VERIFICATION" | "PHONE_TAKEN", number]>([
    ["INVALID_VERIFICATION", 400],
    ["PHONE_TAKEN", 409],
  ])("maps %s to HTTP %s", async (kind, status) => {
    const accounts = accountService();
    vi.mocked(accounts.createAccount).mockResolvedValue({ kind });
    const response = await handleCreatePhoneAccount(request(), accounts, false);
    expect(response.status).toBe(status);
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});
