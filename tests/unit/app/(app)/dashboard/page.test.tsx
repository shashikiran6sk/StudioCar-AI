import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import DashboardPage from "../../../../../apps/web/src/app/(app)/dashboard/page";
import { getCurrentSession } from "../../../../../apps/web/src/server/auth/get-current-session";
import { getDashboardService } from "../../../../../apps/web/src/server/dashboard/dashboard-runtime";
import { DashboardService } from "../../../../../apps/web/src/server/dashboard/dashboard-service";

vi.mock("../../../../../apps/web/src/server/auth/get-current-session", () => ({
  getCurrentSession: vi.fn(),
}));

vi.mock("../../../../../apps/web/src/server/dashboard/dashboard-runtime", () => ({
  getDashboardService: vi.fn(),
}));

vi.mock(
  "../../../../../apps/web/src/features/vehicle-create/vehicle-create-launcher",
  () => ({ VehicleCreateLauncher: () => <button type="button">+ Upload Vehicle</button> }),
);

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

describe("DashboardPage", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("greets the authenticated user without fabricating operational data", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 19, 9));
    vi.mocked(getCurrentSession).mockResolvedValue({
      id: "session-1",
      userId: "user-1",
      expiresAt: new Date(2026, 9, 19),
      user: {
        id: "user-1",
        displayName: "Priya Sharma",
        primaryEmail: "priya@example.com",
        primaryPhone: null,
      },
    });
    const dashboardService = new DashboardService(
      { getOwnedMetrics: vi.fn() },
      { list: vi.fn() },
      { resolve: vi.fn() },
    );
    const getSummary = vi.spyOn(dashboardService, "getSummary").mockResolvedValue({
      activeImageCount: 0,
      imagesProcessed: 0,
      imagesProcessedThisPeriod: 0,
      imagesRemaining: 9,
      planName: "Free",
      processingSuccessRate: null,
      recentVehicles: [],
      storageCapacityBytes: 3_221_225_472,
      storageUsedBytes: 0,
      vehiclesProcessed: 0,
      vehiclesProcessedThisPeriod: 0,
      vehiclesProcessing: 0,
    });
    vi.mocked(getDashboardService).mockReturnValue(dashboardService);
    const page = await DashboardPage();

    render(page);

    expect(screen.getByRole("heading", { name: "Good morning, Priya." }))
      .toBeInTheDocument();
    expect(screen.getByText("Saturday, 19 September")).toBeInTheDocument();
    expect(screen.getByText("No vehicle activity yet")).toBeInTheDocument();
    expect(screen.getByText("Usage remaining")).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: "+ Upload Vehicle" }),
    ).toHaveLength(3);
    expect(getSummary).toHaveBeenCalledWith("user-1", new Date(2026, 8, 19, 9));
  });
});
