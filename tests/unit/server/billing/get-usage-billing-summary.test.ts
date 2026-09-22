import { afterEach, describe, expect, it, vi } from "vitest";

const getSummary = vi.fn();

vi.mock(
  "../../../../apps/web/src/server/billing/usage-billing-runtime",
  () => ({ getUsageBillingService: () => ({ getSummary }) }),
);

const { getUsageBillingSummary } = await import(
  "../../../../apps/web/src/server/billing/get-usage-billing-summary"
);

afterEach(() => {
  getSummary.mockReset();
});

describe("getUsageBillingSummary", () => {
  it("resolves the tenant's own usage summary", async () => {
    const summary = { imagesUsed: 8 };
    getSummary.mockResolvedValue(summary);

    await expect(getUsageBillingSummary("user-1")).resolves.toBe(summary);
    expect(getSummary).toHaveBeenCalledWith("user-1");
  });

  it("propagates a failure so callers can decide how to degrade", async () => {
    getSummary.mockRejectedValue(new Error("usage aggregate unavailable"));

    await expect(getUsageBillingSummary("user-2")).rejects.toThrow(
      "usage aggregate unavailable",
    );
  });
});
