import { describe, expect, it } from "vitest";

import {
  toGrantMessage,
  toRevokeMessage,
} from "../../../../apps/web/src/server/admin/to-admin-action-message";

describe("toGrantMessage", () => {
  it("reports an immediate grant as success", () => {
    expect(toGrantMessage({ kind: "GRANTED", userId: "user-1" })).toMatchObject(
      { kind: "success" },
    );
  });

  it("explains that an invitation waits for a verified sign-in", () => {
    const message = toGrantMessage({ kind: "INVITED", inviteId: "invite-1" });
    expect(message.kind).toBe("success");
    expect(message.message).toMatch(/sign in with it/);
  });

  it("reports an existing administrator and an existing invitation as errors", () => {
    expect(
      toGrantMessage({ kind: "ALREADY_ADMINISTRATOR", userId: "user-1" }).kind,
    ).toBe("error");
    expect(toGrantMessage({ kind: "ALREADY_INVITED" }).kind).toBe("error");
  });
});

describe("toRevokeMessage", () => {
  it("reports a revocation as success", () => {
    expect(toRevokeMessage({ kind: "REVOKED" }).kind).toBe("success");
  });

  it("explains the last-administrator refusal actionably", () => {
    const message = toRevokeMessage({ kind: "LAST_ADMINISTRATOR" });
    expect(message.kind).toBe("error");
    expect(message.message).toMatch(/only administrator/);
  });

  it("reports an account that holds no role", () => {
    expect(toRevokeMessage({ kind: "NOT_ADMINISTRATOR" }).kind).toBe("error");
  });
});
