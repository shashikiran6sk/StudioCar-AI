import { describe, expect, it, vi } from "vitest";

import { UsageBillingService } from "../../../../apps/web/src/server/billing/usage-billing-service";

describe("UsageBillingService", () => {
  it("derives remaining free capacity from immutable usage totals", async () => {
    const repository = {
      getOwnedSummary: vi.fn().mockResolvedValue({
        imageUsage: 4,
        planKey: null,
        storageUsedBytes: 2_048n,
        uploadSessionUsage: 2,
      }),
    };
    const service = new UsageBillingService(repository);

    const summary = await service.getSummary(
      "user-1",
      new Date("2026-09-20T10:00:00.000Z"),
    );

    expect(repository.getOwnedSummary).toHaveBeenCalledWith(
      "user-1",
      "2026-09",
      new Date("2026-09-20T10:00:00.000Z"),
    );
    expect(summary).toMatchObject({
      imagesRemaining: 5,
      imagesUsed: 4,
      storageUsedBytes: 2_048,
      uploadSessionsRemaining: 1,
      uploadSessionsUsed: 2,
    });
  });

  it("falls back safely when a persisted plan is not in the approved catalog", async () => {
    const service = new UsageBillingService({
      getOwnedSummary: vi.fn().mockResolvedValue({
        imageUsage: 20,
        planKey: "UNAPPROVED_PLAN",
        storageUsedBytes: 0n,
        uploadSessionUsage: 10,
      }),
    });

    await expect(service.getSummary("user-1")).resolves.toMatchObject({
      currentPlan: { key: "FREE" },
      imagesRemaining: 0,
      uploadSessionsRemaining: 0,
    });
  });
});
