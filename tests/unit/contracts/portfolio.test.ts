import { describe, expect, it } from "vitest";

import { VehiclePortfolioSchema } from "../../../packages/contracts/src/portfolio";

describe("VehiclePortfolioSchema", () => {
  it("validates normalized options and authorized image URLs", () => {
    const result = VehiclePortfolioSchema.safeParse({
      brand: "BMW",
      completedAt: "2026-09-19T10:00:00.000Z",
      id: "4bb7fa89-c907-4458-9786-8aafc2235728",
      images: [
        {
          displayOrder: 0,
          downloadUrl: "https://assets.example.test/download",
          height: 720,
          id: "6b8bc4df-b9eb-4205-8815-fc099505aa91",
          originalFilename: "front.jpg",
          originalUrl: "https://assets.example.test/original",
          previewUrl: "https://assets.example.test/preview",
          processedUrl: "https://assets.example.test/processed",
          width: 1280,
        },
      ],
      model: "3 Series",
      name: "2022 BMW 3 Series",
      options: { backgroundId: "PREMIUM_WHITE", floorId: "WHITE_STUDIO" },
      status: "COMPLETED",
      stockId: "NL-3429",
      variant: null,
      year: 2022,
    });

    expect(result.success).toBe(true);
  });

  it("rejects portfolios without a completed image", () => {
    expect(
      VehiclePortfolioSchema.safeParse({
        completedAt: "2026-09-19T10:00:00.000Z",
        id: "4bb7fa89-c907-4458-9786-8aafc2235728",
        images: [],
        name: "Empty",
        options: { backgroundId: "PREMIUM_WHITE", floorId: "WHITE_STUDIO" },
        status: "COMPLETED",
      }).success,
    ).toBe(false);
  });
});
