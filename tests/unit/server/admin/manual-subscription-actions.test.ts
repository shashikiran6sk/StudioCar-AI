import { afterEach, describe, expect, it, vi } from "vitest";

const getCurrentSession = vi.fn();
const isCurrentUserAdministrator = vi.fn();
const assign = vi.fn();
const revoke = vi.fn();
const getPlanCatalog = vi.fn();
const revalidatePath = vi.fn();

vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("../../../../apps/web/src/server/auth/get-current-session", () => ({
  getCurrentSession,
}));
vi.mock(
  "../../../../apps/web/src/server/admin/is-current-user-administrator",
  () => ({ isCurrentUserAdministrator }),
);
vi.mock(
  "../../../../apps/web/src/server/admin/manual-subscription-runtime",
  () => ({ getManualSubscriptionRepository: () => ({ assign, revoke }) }),
);
vi.mock("../../../../apps/web/src/server/plans/get-plan-catalog", () => ({
  getPlanCatalog,
}));

const { assignSubscriptionAction, revokeSubscriptionAction } = await import(
  "../../../../apps/web/src/server/admin/manual-subscription-actions"
);
const { DEFAULT_PLAN_CATALOG } = await import(
  "../../../../apps/web/src/server/plans/default-plan-catalog"
);

const ADMIN_ID = "8c879f46-1193-4d77-b785-057fe026d111";
const ACCOUNT_ID = "2b8f0ad2-1c37-4a0d-9b93-9b0e1a1f2c34";

function form(overrides: Record<string, string> = {}): FormData {
  const data = new FormData();
  const fields: Record<string, string> = {
    months: "3",
    planKey: "STUDIO_PRO",
    userId: ACCOUNT_ID,
    ...overrides,
  };
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

function signedInAdministrator() {
  getCurrentSession.mockResolvedValue({ userId: ADMIN_ID });
  isCurrentUserAdministrator.mockResolvedValue(true);
  getPlanCatalog.mockResolvedValue(DEFAULT_PLAN_CATALOG);
}

afterEach(() => {
  vi.resetAllMocks();
});

describe("assignSubscriptionAction", () => {
  it("assigns a plan to one account", async () => {
    signedInAdministrator();
    assign.mockResolvedValue({ kind: "ASSIGNED" });

    const result = await assignSubscriptionAction(null, form());

    expect(result.kind).toBe("success");
    expect(assign).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: ADMIN_ID,
        assignment: { months: 3, planKey: "STUDIO_PRO", userId: ACCOUNT_ID },
      }),
    );
  });

  it("ends the assignment three months after it starts", async () => {
    signedInAdministrator();
    assign.mockResolvedValue({ kind: "ASSIGNED" });

    await assignSubscriptionAction(null, form());

    const [command] = assign.mock.calls[0] ?? [];
    const months =
      (command.periodEnd.getUTCFullYear() - command.now.getUTCFullYear()) * 12 +
      command.periodEnd.getUTCMonth() -
      command.now.getUTCMonth();
    expect(months).toBe(3);
  });

  it("records the reason when one is given", async () => {
    signedInAdministrator();
    assign.mockResolvedValue({ kind: "ASSIGNED" });

    await assignSubscriptionAction(
      null,
      form({ note: "  Migrated from the pilot.  " }),
    );

    expect(assign).toHaveBeenCalledWith(
      expect.objectContaining({
        assignment: expect.objectContaining({
          note: "Migrated from the pilot.",
        }),
      }),
    );
  });

  it("refuses to overwrite a subscription a provider owns", async () => {
    signedInAdministrator();
    assign.mockResolvedValue({ kind: "PROVIDER_MANAGED" });

    const result = await assignSubscriptionAction(null, form());

    expect(result).toEqual({
      kind: "error",
      message:
        "A billing provider owns this account's subscription. Change it there, not here.",
    });
  });

  it("refuses a plan the catalog does not currently offer", async () => {
    signedInAdministrator();
    getPlanCatalog.mockResolvedValue(
      DEFAULT_PLAN_CATALOG.filter((plan) => plan.planKey !== "STUDIO_PRO"),
    );

    const result = await assignSubscriptionAction(null, form());

    expect(result.kind).toBe("error");
    expect(assign).not.toHaveBeenCalled();
  });

  it("refuses a plan an administrator has deactivated", async () => {
    signedInAdministrator();
    getPlanCatalog.mockResolvedValue(
      DEFAULT_PLAN_CATALOG.map((plan) =>
        plan.planKey === "STUDIO_PRO" ? { ...plan, active: false } : plan,
      ),
    );

    const result = await assignSubscriptionAction(null, form());

    expect(result.kind).toBe("error");
    expect(assign).not.toHaveBeenCalled();
  });

  it("refuses to assign the free plan, which is no subscription at all", async () => {
    signedInAdministrator();

    const result = await assignSubscriptionAction(
      null,
      form({ planKey: "FREE" }),
    );

    expect(result.kind).toBe("error");
    expect(assign).not.toHaveBeenCalled();
  });

  it("refuses an open-ended grant", async () => {
    signedInAdministrator();

    const result = await assignSubscriptionAction(null, form({ months: "999" }));

    expect(result.kind).toBe("error");
    expect(assign).not.toHaveBeenCalled();
  });

  it("refuses a signed-out caller", async () => {
    getCurrentSession.mockResolvedValue(null);

    expect((await assignSubscriptionAction(null, form())).kind).toBe("error");
    expect(assign).not.toHaveBeenCalled();
  });

  it("refuses a signed-in caller who is not an administrator", async () => {
    getCurrentSession.mockResolvedValue({ userId: ADMIN_ID });
    isCurrentUserAdministrator.mockResolvedValue(false);

    expect((await assignSubscriptionAction(null, form())).kind).toBe("error");
    expect(assign).not.toHaveBeenCalled();
  });
});

describe("revokeSubscriptionAction", () => {
  it("ends an assignment", async () => {
    signedInAdministrator();
    revoke.mockResolvedValue({ kind: "REVOKED" });

    const data = new FormData();
    data.set("userId", ACCOUNT_ID);
    const result = await revokeSubscriptionAction(null, data);

    expect(result.kind).toBe("success");
    expect(revalidatePath).toHaveBeenCalledWith("/settings/billing");
  });

  it("says so when there was nothing to end", async () => {
    signedInAdministrator();
    revoke.mockResolvedValue({ kind: "NOT_ASSIGNED" });

    const data = new FormData();
    data.set("userId", ACCOUNT_ID);

    expect((await revokeSubscriptionAction(null, data)).kind).toBe("error");
  });

  it("refuses a caller who is not an administrator", async () => {
    getCurrentSession.mockResolvedValue({ userId: ADMIN_ID });
    isCurrentUserAdministrator.mockResolvedValue(false);

    const data = new FormData();
    data.set("userId", ACCOUNT_ID);

    expect((await revokeSubscriptionAction(null, data)).kind).toBe("error");
    expect(revoke).not.toHaveBeenCalled();
  });
});
