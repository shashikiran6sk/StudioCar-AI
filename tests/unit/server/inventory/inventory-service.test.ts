import { VehicleStatus } from "../../../../packages/database-runtime/src";
import type { InventoryVehicleRecord } from "../../../../apps/web/src/server/db/repositories/inventory-repository";
import { describe, expect, it, vi } from "vitest";

import { InventoryService } from "../../../../apps/web/src/server/inventory/inventory-service";

const VEHICLE_ID = "4bb7fa89-c907-4458-9786-8aafc2235728";

function createRecord(): InventoryVehicleRecord {
  return {
    brand: "BMW",
    completedImageCount: 1,
    createdAt: new Date("2026-09-19T10:00:00.000Z"),
    failedImageCount: 1,
    hasCompletedOutput: true,
    id: VEHICLE_ID,
    imageCount: 3,
    model: "3 Series",
    name: "2026 BMW 3 Series",
    previewObjectKey: "users/user-1/vehicles/vehicle-1/preview.webp",
    status: VehicleStatus.PARTIALLY_FAILED,
    stockId: "SC-100",
    year: 2026,
  };
}

describe("InventoryService", () => {
  it("builds aggregate cards and signs only owned repository preview keys", async () => {
    const repository = {
      listOwned: vi.fn().mockResolvedValue({
        counts: {
          all: 1,
          archived: 0,
          completed: 0,
          needsAttention: 1,
          processing: 0,
        },
        items: [createRecord()],
        nextCursor: null,
      }),
    };
    const previewSigner = {
      signPreview: vi.fn().mockResolvedValue("https://signed.example/preview.webp"),
    };
    const service = new InventoryService(repository, previewSigner, {
      previewUrlTtlSeconds: 300,
    });

    const result = await service.list("user-1", {
      filter: "ALL",
      limit: 24,
      mode: "BROWSE",
      sort: "CREATED_DESC",
      view: "GRID",
    });

    expect(repository.listOwned).toHaveBeenCalledWith("user-1", {
      filter: "ALL",
      limit: 24,
      mode: "BROWSE",
      sort: "CREATED_DESC",
      view: "GRID",
    });
    expect(previewSigner.signPreview).toHaveBeenCalledWith(
      "users/user-1/vehicles/vehicle-1/preview.webp",
      300,
    );
    expect(result.items).toEqual([
      {
        brand: "BMW",
        completedImageCount: 1,
        createdAt: "2026-09-19T10:00:00.000Z",
        failedImageCount: 1,
        hasCompletedOutput: true,
        id: VEHICLE_ID,
        imageCount: 3,
        model: "3 Series",
        name: "2026 BMW 3 Series",
        previewUrl: "https://signed.example/preview.webp",
        status: "FAILED",
        stockId: "SC-100",
        year: 2026,
      },
    ]);
  });

  it("does not invoke storage signing when a batch has no completed output", async () => {
    const record = createRecord();
    record.previewObjectKey = null;
    const previewSigner = { signPreview: vi.fn() };
    const service = new InventoryService(
      {
        listOwned: vi.fn().mockResolvedValue({
          counts: {
            all: 1,
            archived: 0,
            completed: 0,
            needsAttention: 1,
            processing: 0,
          },
          items: [record],
          nextCursor: null,
        }),
      },
      previewSigner,
      { previewUrlTtlSeconds: 300 },
    );

    const result = await service.list("user-1", {
      filter: "NEEDS_ATTENTION",
      limit: 24,
      mode: "BROWSE",
      sort: "CREATED_DESC",
      view: "GRID",
    });

    expect(result.items[0]?.previewUrl).toBeNull();
    expect(previewSigner.signPreview).not.toHaveBeenCalled();
  });
});
