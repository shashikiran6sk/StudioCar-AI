import { afterEach, describe, expect, it, vi } from "vitest";

const getSummary = vi.fn();

vi.mock(
  "../../../../apps/web/src/server/billing/get-usage-billing-summary",
  () => ({ getUsageBillingSummary: getSummary }),
);

const { getPlanUsageSummary } = await import(
  "../../../../apps/web/src/server/plan-usage/get-plan-usage-summary"
);

const summary = {
  currentPlan: {
    description: "For individuals trying the StudioCar workflow.",
    imageCapacity: 15,
    key: "FREE" as const,
    name: "Free",
    storageCapacityBytes: 3_221_225_472,
    uploadSessionCapacity: 3,
  },
  imagesRemaining: 7,
  imagesUsed: 8,
  storageUsedBytes: 1_288_490_188,
  uploadSessionsRemaining: 1,
  uploadSessionsUsed: 2,
};

afterEach(() => {
  getSummary.mockReset();
});

describe("getPlanUsageSummary", () => {
  it("returns the sidebar view of the current plan", async () => {
    getSummary.mockResolvedValue(summary);

    await expect(getPlanUsageSummary("user-1")).resolves.toMatchObject({
      planKey: "FREE",
      imagesUsed: 8,
      imageCapacity: 15,
    });
  });

  it("returns null instead of making the workspace unreachable", async () => {
    getSummary.mockRejectedValue(new Error("usage aggregate unavailable"));

    await expect(getPlanUsageSummary("user-2")).resolves.toBeNull();
  });

  it("asks the billing service for the signed-in user only", async () => {
    getSummary.mockResolvedValue(summary);

    await getPlanUsageSummary("user-3");

    expect(getSummary).toHaveBeenCalledWith("user-3");
  });
});
