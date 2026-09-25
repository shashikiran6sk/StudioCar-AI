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
    getBillingStatus.mockResolvedValue({ subscription: null, purchasedCreditsGranted: 0 });

    await expect(getUsageBillingSummary("user-1")).resolves.toBe(summary);
    expect(getSummary).toHaveBeenCalledWith("user-1");
  });

  it("propagates a failure so callers can decide how to degrade", async () => {
    getSummary.mockRejectedValue(new Error("usage aggregate unavailable"));
    getBillingStatus.mockResolvedValue({ subscription: null, purchasedCreditsGranted: 0 });

    await expect(getUsageBillingSummary("user-2")).rejects.toThrow(
      "usage aggregate unavailable",
    );
  });
});
