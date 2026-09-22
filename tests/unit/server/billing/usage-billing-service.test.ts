import { describe, expect, it, vi } from "vitest";

import { UsageBillingService } from "../../../../apps/web/src/server/billing/usage-billing-service";

const now = new Date("2026-09-20T10:00:00.000Z");

function repository(
  planKey: string | null,
  summary: {
    imageUsage: number;
    storageUsedBytes: bigint;
    uploadSessionUsage: number;
  },
) {
  return {
    findOwnedPlanKey: vi.fn().mockResolvedValue(planKey),
    getOwnedSummary: vi.fn().mockResolvedValue({ ...summary, planKey }),
  };
}

describe("UsageBillingService", () => {
  it("derives remaining free capacity from immutable usage totals", async () => {
    const repo = repository(null, {
      imageUsage: 4,
      storageUsedBytes: 2_048n,
      uploadSessionUsage: 2,
    });

    const summary = await new UsageBillingService(repo).getSummary(
      "user-1",
      now,
    );

    expect(summary).toMatchObject({
      imagesRemaining: 11,
      imagesUsed: 4,
      storageUsedBytes: 2_048,
      uploadSessionsUsed: 2,
    });
    expect(summary.currentPlan).toMatchObject({
      key: "FREE",
      imageCapacity: 15,
      maxImagesPerBatch: 5,
      allowanceScope: "LIFETIME",
    });
  });

  it("counts a lifetime allowance across every billing period", async () => {
    const repo = repository(null, {
      imageUsage: 4,
      storageUsedBytes: 0n,
      uploadSessionUsage: 1,
    });

    await new UsageBillingService(repo).getSummary("user-1", now);

    // A free allowance never refills, so it must not be scoped to one month.
    expect(repo.getOwnedSummary).toHaveBeenCalledWith("user-1", null, now);
  });

  it("scopes a billing-period allowance to the current month", async () => {
    const repo = repository("STUDIO_PRO", {
      imageUsage: 120,
      storageUsedBytes: 0n,
      uploadSessionUsage: 8,
    });

    const summary = await new UsageBillingService(repo).getSummary(
      "user-1",
      now,
    );

    expect(repo.getOwnedSummary).toHaveBeenCalledWith("user-1", "2026-09", now);
    expect(summary.currentPlan).toMatchObject({
      key: "STUDIO_PRO",
      allowanceScope: "BILLING_PERIOD",
      imageCapacity: 500,
    });
    expect(summary.imagesRemaining).toBe(380);
  });

  it("never reports negative remaining capacity", async () => {
    const repo = repository(null, {
      imageUsage: 40,
      storageUsedBytes: 0n,
      uploadSessionUsage: 9,
    });

    await expect(
      new UsageBillingService(repo).getSummary("user-1", now),
    ).resolves.toMatchObject({ imagesRemaining: 0 });
  });

  it("falls back safely when a persisted plan is not in the approved catalog", async () => {
    const repo = repository("UNAPPROVED_PLAN", {
      imageUsage: 20,
      storageUsedBytes: 0n,
      uploadSessionUsage: 10,
    });

    const summary = await new UsageBillingService(repo).getSummary(
      "user-1",
      now,
    );

    expect(summary.currentPlan.key).toBe("FREE");
    expect(summary.imagesRemaining).toBe(0);
  });
});
