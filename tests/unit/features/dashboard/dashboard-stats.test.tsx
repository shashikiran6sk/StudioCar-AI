import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DashboardStats } from "../../../../apps/web/src/features/dashboard/dashboard-stats";

describe("DashboardStats", () => {
  it("renders server-derived workspace metrics", () => {
    render(
      <DashboardStats
        summary={{
          activeImageCount: 4,
          imagesProcessed: 2_460,
          imagesProcessedThisPeriod: 6,
          imagesRemaining: 3,
          planName: "Free",
          processingSuccessRate: 96,
          recentVehicles: [],
          storageCapacityBytes: 3_221_225_472,
          storageUsedBytes: 1_288_490_189,
          vehiclesProcessed: 128,
          vehiclesProcessedThisPeriod: 12,
          vehiclesProcessing: 2,
        }}
      />,
    );

    expect(screen.getByText("2,460")).toBeInTheDocument();
    expect(screen.getByText("96% successful")).toBeInTheDocument();
    expect(screen.getByText("1.2 GB")).toBeInTheDocument();
    expect(screen.getByText("4 images active")).toBeInTheDocument();
  });
});
