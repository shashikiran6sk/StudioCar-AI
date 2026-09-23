import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DashboardQuickActions } from "../../../../apps/web/src/features/dashboard/dashboard-quick-actions";

vi.mock(
  "../../../../apps/web/src/features/vehicle-create/vehicle-create-launcher",
  () => ({ VehicleCreateLauncher: () => <button type="button">Upload</button> }),
);

const VEHICLE_ID = "4bb7fa89-c907-4458-9786-8aafc2235728";

const summary = {
  activeImageCount: 2,
  attention: { vehicleCount: 0, vehicleId: null },
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
};

describe("DashboardQuickActions", () => {
  it("offers upload, inventory, and studio creation when nothing needs attention", () => {
    render(<DashboardQuickActions summary={summary} />);

    expect(screen.getByRole("button", { name: "Upload" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open →" })).toHaveAttribute(
      "href",
      "/inventory",
    );
    expect(
      screen.getByRole("heading", { name: "Create studio images" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Create another studio version from an existing vehicle."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create images →" })).toHaveAttribute(
      "href",
      "/inventory?mode=CREATE_STUDIO",
    );
    expect(screen.getByText("3 ready")).toBeInTheDocument();
  });

  it("no longer duplicates Inventory with a Recent results action", () => {
    render(<DashboardQuickActions summary={summary} />);

    expect(screen.queryByRole("heading", { name: "Recent results" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "View portfolio" })).toBeNull();
  });

  it("opens the only affected vehicle's portfolio directly", () => {
    render(
      <DashboardQuickActions
        summary={{
          ...summary,
          attention: { vehicleCount: 1, vehicleId: VEHICLE_ID },
        }}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Attention needed" }),
    ).toBeInTheDocument();
    expect(screen.getByText("1 vehicle needs your attention.")).toBeInTheDocument();
    expect(screen.getByText("1 need attention")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Review issues →" })).toHaveAttribute(
      "href",
      `/inventory/${VEHICLE_ID}#attention`,
    );
    expect(
      screen.queryByRole("heading", { name: "Create studio images" }),
    ).toBeNull();
  });

  it("opens Inventory filtered to affected vehicles when several need attention", () => {
    render(
      <DashboardQuickActions
        summary={{ ...summary, attention: { vehicleCount: 2, vehicleId: null } }}
      />,
    );

    expect(
      screen.getByText("2 vehicles need your attention."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Review issues →" })).toHaveAttribute(
      "href",
      "/inventory?filter=NEEDS_ATTENTION",
    );
  });

  it("gives every action its own imagery", () => {
    render(<DashboardQuickActions summary={summary} />);

    // next/image rewrites and encodes the source, so compare the decoded form.
    const sources = screen
      .getAllByRole("img")
      .map((image) => decodeURIComponent(image.getAttribute("src") ?? ""));
    expect(sources).toHaveLength(3);
    expect(new Set(sources).size).toBe(3);
    expect(sources.every((source) => source.includes("/images/dashboard/"))).toBe(
      true,
    );
  });

  it("describes each image for assistive technology", () => {
    render(<DashboardQuickActions summary={summary} />);

    for (const image of screen.getAllByRole("img")) {
      expect(image.getAttribute("alt")?.length ?? 0).toBeGreaterThan(10);
    }
  });
});
