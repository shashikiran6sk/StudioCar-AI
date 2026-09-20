import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DashboardRecentVehicles } from "../../../../apps/web/src/features/dashboard/dashboard-recent-vehicles";

vi.mock(
  "../../../../apps/web/src/features/vehicle-create/vehicle-create-launcher",
  () => ({ VehicleCreateLauncher: () => <button type="button">Upload vehicle</button> }),
);

describe("DashboardRecentVehicles", () => {
  it("renders a useful empty state without invented vehicles", () => {
    render(<DashboardRecentVehicles vehicles={[]} />);

    expect(screen.getByText("No vehicle activity yet")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Upload vehicle" }),
    ).toBeInTheDocument();
  });

  it("renders tenant-provided recent vehicles and inventory navigation", () => {
    render(
      <DashboardRecentVehicles
        vehicles={[
          {
            brand: "BMW",
            completedImageCount: 1,
            createdAt: "2026-09-18T10:00:00.000Z",
            failedImageCount: 0,
            id: "4bb7fa89-c907-4458-9786-8aafc2235728",
            imageCount: 1,
            model: "3 Series",
            name: "2026 BMW 3 Series",
            previewUrl: null,
            status: "COMPLETED",
            stockId: null,
            year: 2026,
          },
        ]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "2026 BMW 3 Series" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View all inventory →" })).toHaveAttribute(
      "href",
      "/inventory",
    );
  });
});
