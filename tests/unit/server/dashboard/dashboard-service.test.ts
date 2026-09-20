import { describe, expect, it, vi } from "vitest";

import { DashboardService } from "../../../../apps/web/src/server/dashboard/dashboard-service";

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
    };
    const inventory = {
      list: vi.fn().mockResolvedValue({
        counts: {
          all: 0,
          archived: 0,
          completed: 0,
          failed: 0,
          processing: 0,
        },
        items: [],
        nextCursor: null,
      }),
    };
    const service = new DashboardService(repository, inventory);

    const result = await service.getSummary(
      "user-1",
      new Date("2026-09-20T10:00:00.000Z"),
    );

    expect(repository.getOwnedMetrics).toHaveBeenCalledWith(
      "user-1",
      "2026-09",
      new Date("2026-09-01T00:00:00.000Z"),
    );
    expect(inventory.list).toHaveBeenCalledWith("user-1", {
      filter: "ALL",
      limit: 3,
      sort: "CREATED_DESC",
      view: "GRID",
    });
    expect(result).toMatchObject({
      imagesProcessed: 24,
      imagesRemaining: 3,
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
          imagesProcessed: 12,
          imagesProcessedThisPeriod: 12,
          storageUsedBytes: 0n,
          unsuccessfulJobCount: 0,
          vehiclesProcessed: 0,
          vehiclesProcessedThisPeriod: 0,
          vehiclesProcessing: 0,
        }),
      },
      {
        list: vi.fn().mockResolvedValue({
          counts: {
            all: 0,
            archived: 0,
            completed: 0,
            failed: 0,
            processing: 0,
          },
          items: [],
          nextCursor: null,
        }),
      },
    );

    await expect(service.getSummary("user-1")).resolves.toMatchObject({
      imagesRemaining: 0,
      processingSuccessRate: null,
    });
  });
});
