import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DashboardQuickActions } from "../../../../apps/web/src/features/dashboard/dashboard-quick-actions";

vi.mock(
  "../../../../apps/web/src/features/vehicle-create/vehicle-create-launcher",
  () => ({ VehicleCreateLauncher: () => <button type="button">Upload</button> }),
);

describe("DashboardQuickActions", () => {
  it("links inventory and completed portfolios to real application views", () => {
    render(
      <DashboardQuickActions
        summary={{
          activeImageCount: 2,
          imagesProcessed: 4,
          imagesProcessedThisPeriod: 2,
          imagesRemaining: 7,
          planName: "Free",
          processingSuccessRate: 100,
          recentVehicles: [],
          storageCapacityBytes: 3_221_225_472,
          storageUsedBytes: 1_024,
          vehiclesProcessed: 3,
          vehiclesProcessedThisPeriod: 1,
          vehiclesProcessing: 1,
        }}
      />,
    );

    expect(screen.getByRole("button", { name: "Upload" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Open →" })[0]).toHaveAttribute(
      "href",
      "/inventory",
    );
    expect(screen.getAllByRole("link", { name: "Open →" })[1]).toHaveAttribute(
      "href",
      "/inventory?filter=COMPLETED",
    );
  });
});
