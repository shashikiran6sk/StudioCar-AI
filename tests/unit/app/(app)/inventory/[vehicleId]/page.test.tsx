import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import VehiclePortfolioPage from "../../../../../../apps/web/src/app/(app)/inventory/[vehicleId]/page";
import { getCurrentSession } from "../../../../../../apps/web/src/server/auth/get-current-session";
import { PORTFOLIO_TEST_DATA } from "../../../../features/portfolio/portfolio-test-data";

const getPortfolio = vi.hoisted(() => vi.fn());

vi.mock("../../../../../../apps/web/src/server/auth/get-current-session", () => ({
  getCurrentSession: vi.fn(),
}));

vi.mock("../../../../../../apps/web/src/server/portfolio/portfolio-runtime", () => ({
  getPortfolioService: () => ({ get: getPortfolio }),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
  redirect: vi.fn(),
}));

describe("VehiclePortfolioPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentSession).mockResolvedValue({
      expiresAt: new Date("2026-10-19T10:00:00.000Z"),
      id: "session-1",
      user: {
        displayName: "Priya Sharma",
        id: "user-1",
        primaryEmail: "priya@example.com",
        primaryPhone: null,
      },
      userId: "user-1",
    });
    getPortfolio.mockResolvedValue(PORTFOLIO_TEST_DATA);
  });

  it("loads the portfolio through the authenticated tenant boundary", async () => {
    const page = await VehiclePortfolioPage({
      params: Promise.resolve({ vehicleId: PORTFOLIO_TEST_DATA.id }),
    });
    render(page);

    expect(getPortfolio).toHaveBeenCalledWith("user-1", PORTFOLIO_TEST_DATA.id);
    expect(screen.getByRole("heading", { name: PORTFOLIO_TEST_DATA.name })).toBeVisible();
    expect(screen.getByRole("slider", { name: "Compare original and processed image" }))
      .toBeVisible();
  });
});
