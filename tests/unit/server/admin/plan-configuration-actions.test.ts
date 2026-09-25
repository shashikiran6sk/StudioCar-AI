import { afterEach, describe, expect, it, vi } from "vitest";

const getCurrentSession = vi.fn();
const isCurrentUserAdministrator = vi.fn();
const update = vi.fn();
const revalidatePath = vi.fn();

vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("../../../../apps/web/src/server/auth/get-current-session", () => ({
  getCurrentSession,
}));
vi.mock(
  "../../../../apps/web/src/server/admin/is-current-user-administrator",
  () => ({ isCurrentUserAdministrator }),
);
vi.mock("../../../../apps/web/src/server/plans/plan-config-runtime", () => ({
  getPlanConfigRepository: () => ({ update }),
}));

const { savePlanConfigurationAction } = await import(
  "../../../../apps/web/src/server/admin/plan-configuration-actions"
);

const ADMIN_ID = "8c879f46-1193-4d77-b785-057fe026d111";

function form(overrides: Record<string, string> = {}): FormData {
  const data = new FormData();
  const fields: Record<string, string> = {
    active: "on",
    billingInterval: "MONTHLY",
    description: "For high-volume teams.",
    displayName: "Studio Pro",
    displayOrder: "2",
    features: "400 images each month",
    includedImages: "400",
    maxImagesPerBatch: "20",
    planKey: "STUDIO_PRO",
    priceRupees: "5499",
    segment: "Teams",
    storageGigabytes: "",
    ...overrides,
  };
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

function signedInAdministrator() {
  getCurrentSession.mockResolvedValue({ userId: ADMIN_ID });
  isCurrentUserAdministrator.mockResolvedValue(true);
}

afterEach(() => {
  vi.resetAllMocks();
});

describe("savePlanConfigurationAction", () => {
  it("saves an edit made by an administrator", async () => {
    signedInAdministrator();

    const result = await savePlanConfigurationAction(null, form());

    expect(result.kind).toBe("success");
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: ADMIN_ID,
        planKey: "STUDIO_PRO",
        update: expect.objectContaining({ priceMinorUnits: 549_900 }),
      }),
    );
  });

  it("refreshes every surface that quotes a price", async () => {
    signedInAdministrator();

    await savePlanConfigurationAction(null, form());

    expect(revalidatePath).toHaveBeenCalledWith("/admin/pricing");
    expect(revalidatePath).toHaveBeenCalledWith("/settings/billing");
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });

  it("refuses a signed-out caller", async () => {
    getCurrentSession.mockResolvedValue(null);

    const result = await savePlanConfigurationAction(null, form());

    expect(result.kind).toBe("error");
    expect(update).not.toHaveBeenCalled();
  });

  it("refuses a signed-in caller who is not an administrator", async () => {
    // The page is hidden, but a server action is an endpoint anyone can call.
    getCurrentSession.mockResolvedValue({ userId: ADMIN_ID });
    isCurrentUserAdministrator.mockResolvedValue(false);

    const result = await savePlanConfigurationAction(null, form());

    expect(result.kind).toBe("error");
    expect(update).not.toHaveBeenCalled();
  });

  it("refuses to invent a plan the product does not ship", async () => {
    signedInAdministrator();

    const result = await savePlanConfigurationAction(
      null,
      form({ planKey: "STUDIO_INFINITE" }),
    );

    expect(result).toEqual({
      kind: "error",
      message: "That plan does not exist.",
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("refuses a batch limit larger than the plan's allowance", async () => {
    signedInAdministrator();

    const result = await savePlanConfigurationAction(
      null,
      form({ includedImages: "10", maxImagesPerBatch: "50" }),
    );

    expect(result.kind).toBe("error");
    expect(update).not.toHaveBeenCalled();
  });

  it("reports a failed write instead of claiming the plan was saved", async () => {
    signedInAdministrator();
    update.mockRejectedValue(new Error("constraint violated"));

    const result = await savePlanConfigurationAction(null, form());

    expect(result.kind).toBe("error");
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
