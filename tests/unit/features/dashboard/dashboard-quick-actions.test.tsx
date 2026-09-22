import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DashboardQuickActions } from "../../../../apps/web/src/features/dashboard/dashboard-quick-actions";

vi.mock(
  "../../../../apps/web/src/features/vehicle-create/vehicle-create-launcher",
  () => ({ VehicleCreateLauncher: () => <button type="button">Upload</button> }),
);

const summary = {
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
};

describe("DashboardQuickActions", () => {
  it("links inventory and completed results to real application views", () => {
    render(<DashboardQuickActions summary={summary} />);

    expect(screen.getByRole("button", { name: "Upload" })).toBeInTheDocument();
    const links = screen.getAllByRole("link", { name: "Open →" });
    expect(links[0]).toHaveAttribute("href", "/inventory");
    expect(links[1]).toHaveAttribute("href", "/inventory?filter=COMPLETED");
  });

  it("names the third action for the results it reveals", () => {
    render(<DashboardQuickActions summary={summary} />);

    expect(
      screen.getByRole("heading", { name: "Recent results" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "View portfolio" })).toBeNull();
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
