import { describe, expect, it } from "vitest";

import { DashboardSummarySchema } from "../../../packages/contracts/src/dashboard";

describe("DashboardSummarySchema", () => {
  it("accepts bounded server-derived dashboard data", () => {
    const result = DashboardSummarySchema.safeParse({
      activeImageCount: 4,
      attention: {
        vehicleCount: 1,
        vehicleId: "4bb7fa89-c907-4458-9786-8aafc2235728",
      },
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
      attention: { vehicleCount: -1, vehicleId: null },
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

  it("represents a plan without a storage capacity as null, never zero", () => {
    const summary = {
      activeImageCount: 0,
      attention: { vehicleCount: 0, vehicleId: null },
      imagesProcessed: 0,
      imagesProcessedThisPeriod: 0,
      imagesRemaining: 15,
      planName: "Free",
      processingSuccessRate: null,
      recentVehicles: [],
      storageUsedBytes: 0,
      vehiclesProcessed: 0,
      vehiclesProcessedThisPeriod: 0,
      vehiclesProcessing: 0,
    };

    expect(
      DashboardSummarySchema.safeParse({ ...summary, storageCapacityBytes: null }).success,
    ).toBe(true);
    // Zero once stood in for "no capacity" and rendered as "of 0 B".
    expect(
      DashboardSummarySchema.safeParse({ ...summary, storageCapacityBytes: 0 }).success,
    ).toBe(false);
  });
});
