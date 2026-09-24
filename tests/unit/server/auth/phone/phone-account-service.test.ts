import { describe, expect, it, vi } from "vitest";

import { hashAuthSecret } from "../../../../../apps/web/src/server/auth/hash-auth-secret";
import { PhoneAccountService } from "../../../../../apps/web/src/server/auth/phone/phone-account-service";
import type { PhoneAccountRepositoryPort } from "../../../../../apps/web/src/server/auth/phone/phone-account.types";

const NOW = new Date("2026-09-24T12:00:00.000Z");
const EXPIRES_AT = new Date("2026-10-24T12:00:00.000Z");
const CHALLENGE_ID = "4f9d4891-157f-49ed-aa5a-c026abc0a768";
const BINDING = "browser-secret";

function repository(): PhoneAccountRepositoryPort {
  return {
    findVerified: vi.fn(async () => ({
      phoneNumber: "+919876543210",
      expiresAt: new Date("2026-09-24T12:10:00.000Z"),
    })),
    createAccount: vi.fn<PhoneAccountRepositoryPort["createAccount"]>(async () => ({
      kind: "CREATED",
      session: {
        id: "session-1",
        userId: "user-1",
        expiresAt: EXPIRES_AT,
        user: {
          id: "user-1",
          displayName: "Shashi Kiran",
          primaryEmail: null,
          primaryPhone: "+919876543210",
        },
      },
    })),
  };
}

describe("PhoneAccountService", () => {
  it("reads verified phone state using only the server-side challenge and binding", async () => {
    const accounts = repository();
    const service = new PhoneAccountService(
      accounts,
      { prepareIssue: vi.fn() },
      () => NOW,
    );

    await expect(service.findVerified(CHALLENGE_ID, BINDING)).resolves.toMatchObject({
      phoneNumber: "+919876543210",
    });
    expect(accounts.findVerified).toHaveBeenCalledWith({
      challengeId: CHALLENGE_ID,
      browserBindingHash: hashAuthSecret(BINDING),
      now: NOW,
    });
  });

  it("validates the name and issues the prepared session for one account", async () => {
    const accounts = repository();
    const service = new PhoneAccountService(
      accounts,
      {
        prepareIssue: vi.fn(() => ({
          token: "t".repeat(43),
          tokenHash: "h".repeat(64),
          expiresAt: EXPIRES_AT,
        })),
      },
      () => NOW,
    );

    const result = await service.createAccount(CHALLENGE_ID, BINDING, {
      displayName: "  Shashi Kiran  ",
    });
    expect(result.kind).toBe("CREATED");
    expect(accounts.createAccount).toHaveBeenCalledWith({
      challengeId: CHALLENGE_ID,
      browserBindingHash: hashAuthSecret(BINDING),
      now: NOW,
      displayName: "Shashi Kiran",
      session: {
        token: "t".repeat(43),
        tokenHash: "h".repeat(64),
        expiresAt: EXPIRES_AT,
      },
    });
  });

  it("rejects invalid names before any database mutation", async () => {
    const accounts = repository();
    const service = new PhoneAccountService(
      accounts,
      { prepareIssue: vi.fn() },
      () => NOW,
    );
    await expect(
      service.createAccount(CHALLENGE_ID, BINDING, { displayName: "A" }),
    ).rejects.toThrow();
    expect(accounts.createAccount).not.toHaveBeenCalled();
  });
});
