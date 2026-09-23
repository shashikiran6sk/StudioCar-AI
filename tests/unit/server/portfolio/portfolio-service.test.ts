import { VehicleStatus } from "../../../../packages/database-runtime/src";
import type { PortfolioVehicleRecord } from "../../../../apps/web/src/server/db/repositories/portfolio-repository";
import { describe, expect, it, vi } from "vitest";

import { PortfolioService } from "../../../../apps/web/src/server/portfolio/portfolio-service";

const VEHICLE_ID = "4bb7fa89-c907-4458-9786-8aafc2235728";

function createPortfolioRecord(): PortfolioVehicleRecord {
  return {
    brand: "BMW",
    id: VEHICLE_ID,
    model: "3 Series",
    name: "2022 BMW 3 Series",
    processingJobs: [
      {
        completedAt: new Date("2026-09-19T10:30:00.000Z"),
        displayOrder: 0,
        id: "788fc192-9000-4c05-b924-d3bd6d236cab",
        imageAsset: {
          mimeType: "image/jpeg",
          originalFilename: "front.jpg",
          originalObjectKey: "private/original.jpg",
        },
        options: {
          backgroundId: "PREMIUM_WHITE",
          floorId: "WHITE_TURNTABLE",
          crop: "MAINTAIN_COMPOSITION",
          enhancement: true,
          outputFormat: "WEBP",
          paddingPercent: 8,
          platePrivacy: true,
          quality: 90,
          shadow: "NATURAL",
        },
        processedAsset: {
          height: 720,
          id: "6b8bc4df-b9eb-4205-8815-fc099505aa91",
          mimeType: "image/webp",
          objectKey: "private/processed.webp",
          previewObjectKey: "private/preview.webp",
          width: 1280,
        },
      },
    ],
    status: VehicleStatus.READY,
    stockId: "NL-3429",
    variant: null,
    year: 2022,
  };
}

describe("PortfolioService", () => {
  it("signs only keys returned by the owned repository", async () => {
    const record = createPortfolioRecord();
    const repository = { findOwned: vi.fn().mockResolvedValue(record) };
    const signer = {
      signDownload: vi.fn().mockResolvedValue("https://signed.test/download"),
      signInline: vi
        .fn()
        .mockResolvedValueOnce("https://signed.test/original")
        .mockResolvedValueOnce("https://signed.test/processed")
        .mockResolvedValueOnce("https://signed.test/preview"),
    };
    const service = new PortfolioService(repository, signer, {
      assetUrlTtlSeconds: 300,
    });

    const result = await service.get("owner-1", VEHICLE_ID);

    expect(repository.findOwned).toHaveBeenCalledWith("owner-1", VEHICLE_ID);
    expect(signer.signInline).toHaveBeenNthCalledWith(
      1,
      "private/original.jpg",
      "image/jpeg",
      300,
    );
    expect(signer.signDownload).toHaveBeenCalledWith(
      "private/processed.webp",
      "image/webp",
      "processed-01.webp",
      300,
    );
    expect(result).toMatchObject({
      completedAt: "2026-09-19T10:30:00.000Z",
      id: VEHICLE_ID,
      status: "COMPLETED",
    });
    expect(result?.images[0]).toMatchObject({
      originalUrl: "https://signed.test/original",
      processedUrl: "https://signed.test/processed",
      previewUrl: "https://signed.test/preview",
    });
  });

  it("does not sign anything when the portfolio is not owned or ready", async () => {
    const signer = { signDownload: vi.fn(), signInline: vi.fn() };
    const service = new PortfolioService(
      { findOwned: vi.fn().mockResolvedValue(null) },
      signer,
      { assetUrlTtlSeconds: 300 },
    );

    await expect(service.get("owner-1", VEHICLE_ID)).resolves.toBeNull();
    expect(signer.signInline).not.toHaveBeenCalled();
    expect(signer.signDownload).not.toHaveBeenCalled();
  });
});
