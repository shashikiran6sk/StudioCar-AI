import { describe, expect, it, vi } from "vitest";

import { DashboardService } from "../../../../apps/web/src/server/dashboard/dashboard-service";


/**
 * The dashboard reports allowance against the tenant's resolved plan, so tests
 * state that plan explicitly rather than assuming the free one.
 */
function planUsage(overrides: Partial<{
  imagesUsed: number;
  imageCapacity: number;
  planName: string;
  storageCapacityBytes: number | null;
}> = {}) {
  return {
    resolve: vi.fn().mockResolvedValue({
      planKey: "FREE" as const,
      planName: "Free",
      imagesUsed: 0,
      imageCapacity: 15,
      storageUsedBytes: 0,
      storageCapacityBytes: 3_221_225_472,
      ...overrides,
    }),
  };
}

describe("DashboardService", () => {
  it("maps tenant metrics and bounded recent inventory into a dashboard summary", async () => {
    const repository = {
      getOwnedMetrics: vi.fn().mockResolvedValue({
        activeImageCount: 4,
        completedJobCount: 19,
        imagesProcessed: 24,
        imagesProcessedThisPeriod: 6,
        storageUsedBytes: 2_048n,
        unsuccessfulJobCount: 1,
        vehiclesProcessed: 5,
        vehiclesProcessedThisPeriod: 2,
        vehiclesProcessing: 1,
      }),
      getOwnedAttention: vi.fn().mockResolvedValue({
        vehicleCount: 1,
        vehicleId: "4bb7fa89-c907-4458-9786-8aafc2235728",
      }),
    };
    const inventory = {
      list: vi.fn().mockResolvedValue({
        counts: {
          all: 0,
          archived: 0,
          completed: 0,
          needsAttention: 0,
          processing: 0,
        },
        items: [],
        nextCursor: null,
      }),
    };
    const service = new DashboardService(
      repository,
      inventory,
      planUsage({ imagesUsed: 6 }),
    );

    const result = await service.getSummary(
      "user-1",
      new Date("2026-09-20T10:00:00.000Z"),
    );

    expect(repository.getOwnedMetrics).toHaveBeenCalledWith(
      "user-1",
      "2026-09",
      new Date("2026-09-01T00:00:00.000Z"),
    );
    expect(repository.getOwnedAttention).toHaveBeenCalledWith("user-1");
    expect(inventory.list).toHaveBeenCalledWith("user-1", {
      filter: "ALL",
      limit: 3,
      mode: "BROWSE",
      sort: "CREATED_DESC",
      view: "GRID",
    });
    expect(result).toMatchObject({
      attention: {
        vehicleCount: 1,
        vehicleId: "4bb7fa89-c907-4458-9786-8aafc2235728",
      },
      imagesProcessed: 24,
      imagesRemaining: 9,
      processingSuccessRate: 95,
      storageUsedBytes: 2_048,
      vehiclesProcessed: 5,
    });
  });

  it("never reports negative remaining usage", async () => {
    const service = new DashboardService(
      {
        getOwnedMetrics: vi.fn().mockResolvedValue({
          activeImageCount: 0,
          completedJobCount: 0,
          imagesProcessed: 20,
          imagesProcessedThisPeriod: 20,
          storageUsedBytes: 0n,
          unsuccessfulJobCount: 0,
          vehiclesProcessed: 0,
          vehiclesProcessedThisPeriod: 0,
          vehiclesProcessing: 0,
        }),
        getOwnedAttention: vi.fn().mockResolvedValue({
          vehicleCount: 0,
          vehicleId: null,
        }),
      },
      {
        list: vi.fn().mockResolvedValue({
          counts: {
            all: 0,
            archived: 0,
            completed: 0,
            needsAttention: 0,
            processing: 0,
          },
          items: [],
          nextCursor: null,
        }),
      },
      planUsage({ imagesUsed: 20 }),
    );

    await expect(service.getSummary("user-1")).resolves.toMatchObject({
      imagesRemaining: 0,
      processingSuccessRate: null,
    });
  });
});
