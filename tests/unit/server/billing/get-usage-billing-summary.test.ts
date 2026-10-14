import { afterEach, describe, expect, it, vi } from "vitest";

const getSummary = vi.fn();
const getBillingStatus = vi.fn();

vi.mock(
  "../../../../apps/web/src/server/billing/usage-billing-runtime",
  () => ({ getUsageBillingService: () => ({ getSummary }) }),
);
vi.mock("../../../../apps/web/src/server/billing/get-billing-status", () => ({ getBillingStatus }));
vi.mock("../../../../apps/web/src/server/billing/billing-runtime", () => ({ getBillingRuntime: () => ({ database: {} }) }));
vi.mock("../../../../apps/web/src/server/plans/get-plan-catalog", () => ({ getPlanCatalog: () => Promise.resolve([]) }));

const { getUsageBillingSummary } = await import(
  "../../../../apps/web/src/server/billing/get-usage-billing-summary"
);

afterEach(() => {
  getSummary.mockReset();
  getBillingStatus.mockReset();
});

describe("getUsageBillingSummary", () => {
  it("resolves the tenant's own usage summary", async () => {
    const summary = { imagesUsed: 8 };
    getSummary.mockResolvedValue(summary);
    getBillingStatus.mockResolvedValue({ checkoutPaymentStatus: null, purchasedCreditsGranted: 0 });

    await expect(getUsageBillingSummary("user-1")).resolves.toBe(summary);
    expect(getSummary).toHaveBeenCalledWith("user-1");
  });

  it("propagates a failure so callers can decide how to degrade", async () => {
    getSummary.mockRejectedValue(new Error("usage aggregate unavailable"));
    getBillingStatus.mockResolvedValue({ checkoutPaymentStatus: null, purchasedCreditsGranted: 0 });

    await expect(getUsageBillingSummary("user-2")).rejects.toThrow(
      "usage aggregate unavailable",
    );
  });
  it("keeps cumulative paid balance when sales are paused and Plus is absent from the active catalog", async () => {
    getSummary.mockResolvedValue({ currentPlan: { key: "STUDIO_PLUS" }, imagesUsed: 0, storageUsedBytes: 0, uploadSessionsUsed: 0, uploadSessionsRemaining: null });
    getBillingStatus.mockResolvedValue({ purchasedCredits: 145, purchasedCreditsGranted: 200, checkoutPaymentStatus: null });
    const result = await getUsageBillingSummary("paused-buyer");
    expect(result.currentPlan).toMatchObject({ key: "STUDIO_PLUS", imageCapacity: 200, allowanceScope: "LIFETIME" });
    expect(result.imagesRemaining).toBe(145);
    expect(result.imagesUsed).toBe(55);
  });

});
