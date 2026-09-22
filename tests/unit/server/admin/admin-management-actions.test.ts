import { afterEach, describe, expect, it, vi } from "vitest";

const getCurrentSession = vi.fn();
const isCurrentUserAdministrator = vi.fn();
const grantOrInvite = vi.fn();
const revoke = vi.fn();
const revokeInvite = vi.fn();

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("../../../../apps/web/src/server/auth/get-current-session", () => ({
  getCurrentSession,
}));
vi.mock(
  "../../../../apps/web/src/server/admin/is-current-user-administrator",
  () => ({ isCurrentUserAdministrator }),
);
vi.mock(
  "../../../../apps/web/src/server/admin/admin-management-runtime",
  () => ({
    getAdminManagementRepository: () => ({
      grantOrInvite,
      revoke,
      revokeInvite,
    }),
  }),
);

const actions = await import(
  "../../../../apps/web/src/server/admin/admin-management-actions"
);

const ADMIN_ID = "8c879f46-1193-4d77-b785-057fe026d111";
const TARGET_ID = "331a1e25-b9d8-4b1a-a398-8351a58f8c24";
const INVITE_ID = "0e879f46-1193-4d77-b785-057fe026d998";

function form(entries: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.set(key, value);
  return data;
}

function signedInAsAdministrator(): void {
  getCurrentSession.mockResolvedValue({ userId: ADMIN_ID });
  isCurrentUserAdministrator.mockResolvedValue(true);
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("grantAdministratorAction", () => {
  it("grants for an administrator", async () => {
    signedInAsAdministrator();
    grantOrInvite.mockResolvedValue({ kind: "GRANTED", userId: TARGET_ID });

    const result = await actions.grantAdministratorAction(
      null,
      form({ email: "Target@Example.com" }),
    );

    expect(result.kind).toBe("success");
    expect(grantOrInvite).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "target@example.com",
        actorUserId: ADMIN_ID,
      }),
    );
  });

  it("refuses a signed-in non-administrator without touching the database", async () => {
    getCurrentSession.mockResolvedValue({ userId: TARGET_ID });
    isCurrentUserAdministrator.mockResolvedValue(false);

    const result = await actions.grantAdministratorAction(
      null,
      form({ email: "target@example.com" }),
    );

    expect(result.kind).toBe("error");
    expect(grantOrInvite).not.toHaveBeenCalled();
  });

  it("refuses when nobody is signed in", async () => {
    getCurrentSession.mockResolvedValue(null);

    const result = await actions.grantAdministratorAction(
      null,
      form({ email: "target@example.com" }),
    );

    expect(result.kind).toBe("error");
    expect(isCurrentUserAdministrator).not.toHaveBeenCalled();
    expect(grantOrInvite).not.toHaveBeenCalled();
  });

  it("rejects an invalid address before reaching the database", async () => {
    signedInAsAdministrator();

    const result = await actions.grantAdministratorAction(
      null,
      form({ email: "not-an-email" }),
    );

    expect(result).toMatchObject({ kind: "error" });
    expect(grantOrInvite).not.toHaveBeenCalled();
  });

  it("reports a failure safely rather than throwing", async () => {
    signedInAsAdministrator();
    grantOrInvite.mockRejectedValue(new Error("database unavailable"));

    await expect(
      actions.grantAdministratorAction(
        null,
        form({ email: "target@example.com" }),
      ),
    ).resolves.toMatchObject({ kind: "error" });
  });
});

describe("revokeAdministratorAction", () => {
  it("revokes for an administrator", async () => {
    signedInAsAdministrator();
    revoke.mockResolvedValue({ kind: "REVOKED" });

    const result = await actions.revokeAdministratorAction(
      null,
      form({ userId: TARGET_ID }),
    );

    expect(result.kind).toBe("success");
    expect(revoke).toHaveBeenCalledWith({
      userId: TARGET_ID,
      actorUserId: ADMIN_ID,
    });
  });

  it("surfaces the last-administrator refusal", async () => {
    signedInAsAdministrator();
    revoke.mockResolvedValue({ kind: "LAST_ADMINISTRATOR" });

    const result = await actions.revokeAdministratorAction(
      null,
      form({ userId: ADMIN_ID }),
    );

    expect(result).toMatchObject({ kind: "error" });
    expect(result.message).toMatch(/only administrator/);
  });

  it("refuses a non-administrator", async () => {
    getCurrentSession.mockResolvedValue({ userId: TARGET_ID });
    isCurrentUserAdministrator.mockResolvedValue(false);

    await actions.revokeAdministratorAction(null, form({ userId: ADMIN_ID }));

    expect(revoke).not.toHaveBeenCalled();
  });

  it("rejects an identifier that is not a real id", async () => {
    signedInAsAdministrator();

    await actions.revokeAdministratorAction(null, form({ userId: "nope" }));

    expect(revoke).not.toHaveBeenCalled();
  });
});

describe("revokeInvitationAction", () => {
  it("cancels an invitation for an administrator", async () => {
    signedInAsAdministrator();
    revokeInvite.mockResolvedValue(true);

    const result = await actions.revokeInvitationAction(
      null,
      form({ inviteId: INVITE_ID }),
    );

    expect(result.kind).toBe("success");
  });

  it("reports an invitation that was already gone", async () => {
    signedInAsAdministrator();
    revokeInvite.mockResolvedValue(false);

    const result = await actions.revokeInvitationAction(
      null,
      form({ inviteId: INVITE_ID }),
    );

    expect(result.kind).toBe("error");
  });

  it("refuses a non-administrator", async () => {
    getCurrentSession.mockResolvedValue({ userId: TARGET_ID });
    isCurrentUserAdministrator.mockResolvedValue(false);

    await actions.revokeInvitationAction(null, form({ inviteId: INVITE_ID }));

    expect(revokeInvite).not.toHaveBeenCalled();
  });
});
