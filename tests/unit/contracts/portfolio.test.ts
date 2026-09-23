import { describe, expect, it } from "vitest";

import { VehiclePortfolioSchema } from "../../../packages/contracts/src/portfolio";

const VERSION_ID = "e".repeat(64);

const portfolio = {
  attention: null,
  brand: "BMW",
  canCreateVersion: true,
  id: "4bb7fa89-c907-4458-9786-8aafc2235728",
  images: [
    {
      displayOrder: 0,
      downloadFilename: "processed-01.webp",
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
  selectedVersionId: VERSION_ID,
  status: "COMPLETED",
  stockId: "NL-3429",
  variant: null,
  versions: [
    {
      completedAt: "2026-09-19T10:00:00.000Z",
      id: VERSION_ID,
      imageCount: 1,
      label: null,
      options: {},
    },
  ],
  year: 2022,
};

describe("VehiclePortfolioSchema", () => {
  it("validates normalized options and authorized image URLs", () => {
    const result = VehiclePortfolioSchema.safeParse(portfolio);

    expect(result.success).toBe(true);
    expect(result.data?.versions[0]?.options.background).toBe("PREMIUM_WHITE");
  });

  it("allows a vehicle with no completed image yet", () => {
    expect(
      VehiclePortfolioSchema.safeParse({
        ...portfolio,
        images: [],
        selectedVersionId: null,
        status: "PROCESSING",
        versions: [],
      }).success,
    ).toBe(true);
  });

  it("carries failed images only with a user-facing reason", () => {
    const attention = {
      failedImages: [
        {
          assetId: "7c9cd5e0-c8f5-4316-9926-3540a61f1ba2",
          displayOrder: 1,
          jobId: "8dade6f1-d906-4427-8a37-4651b7202cb3",
          originalFilename: "side.jpg",
          originalUrl: "https://assets.example.test/side",
          reason: "SERVICE_UNAVAILABLE",
          replaceRequired: false,
        },
      ],
      imageCount: 2,
      options: {},
    };

    expect(
      VehiclePortfolioSchema.safeParse({
        ...portfolio,
        attention,
        status: "NEEDS_ATTENTION",
      }).success,
    ).toBe(true);
    expect(
      VehiclePortfolioSchema.safeParse({
        ...portfolio,
        attention: {
          ...attention,
          failedImages: [{ ...attention.failedImages[0], errorMessage: "timeout" }],
        },
      }).success,
    ).toBe(false);
    expect(
      VehiclePortfolioSchema.safeParse({
        ...portfolio,
        attention: { ...attention, failedImages: [] },
      }).success,
    ).toBe(false);
  });

  it("carries a version's label, trimmed, and refuses a blank one", () => {
    const labelled = VehiclePortfolioSchema.parse({
      ...portfolio,
      versions: [{ ...portfolio.versions[0], label: "  T02-S04  " }],
    });
    expect(labelled.versions[0]?.label).toBe("T02-S04");
    expect(
      VehiclePortfolioSchema.safeParse({
        ...portfolio,
        versions: [{ ...portfolio.versions[0], label: "   " }],
      }).success,
    ).toBe(false);
  });

  it("rejects a version identifier that is not a treatment key", () => {
    expect(
      VehiclePortfolioSchema.safeParse({ ...portfolio, selectedVersionId: "white" })
        .success,
    ).toBe(false);
  });
});
