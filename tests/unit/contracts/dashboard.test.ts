import { describe, expect, it } from "vitest";

import { DashboardSummarySchema } from "../../../packages/contracts/src/dashboard";

describe("DashboardSummarySchema", () => {
  it("accepts bounded server-derived dashboard data", () => {
    const result = DashboardSummarySchema.safeParse({
      activeImageCount: 4,
      imagesProcessed: 20,
      imagesProcessedThisPeriod: 6,
      imagesRemaining: 3,
      planName: "Free",
      processingSuccessRate: 95,
      recentVehicles: [],
      storageCapacityBytes: 3_221_225_472,
      storageUsedBytes: 1_024,
      vehiclesProcessed: 5,
      vehiclesProcessedThisPeriod: 2,
      vehiclesProcessing: 1,
    });

    expect(result.success).toBe(true);
  });

  it("rejects fabricated out-of-range metrics", () => {
    const result = DashboardSummarySchema.safeParse({
      activeImageCount: 0,
      imagesProcessed: 0,
      imagesProcessedThisPeriod: 0,
      imagesRemaining: -1,
      planName: "Free",
      processingSuccessRate: 101,
      recentVehicles: [],
      storageCapacityBytes: 0,
      storageUsedBytes: 0,
      vehiclesProcessed: 0,
      vehiclesProcessedThisPeriod: 0,
      vehiclesProcessing: 0,
    });

    expect(result.success).toBe(false);
  });
});
