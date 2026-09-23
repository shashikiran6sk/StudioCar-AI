import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import VehiclePortfolioPage from "../../../../../../apps/web/src/app/(app)/inventory/[vehicleId]/page";
import { getCurrentSession } from "../../../../../../apps/web/src/server/auth/get-current-session";
import {
  ATTENTION_TEST_DATA,
  PORTFOLIO_TEST_DATA,
  WHITE_VERSION_ID,
} from "../../../../features/portfolio/portfolio-test-data";
import { failedSelectionContext } from "../../../../features/vehicle-create/studio-selection-test-data";

const getPortfolio = vi.hoisted(() => vi.fn());
const getStudioSelection = vi.hoisted(() => vi.fn());

vi.mock("../../../../../../apps/web/src/server/auth/get-current-session", () => ({
  getCurrentSession: vi.fn(),
}));

vi.mock("../../../../../../apps/web/src/server/portfolio/portfolio-runtime", () => ({
  getPortfolioService: () => ({ get: getPortfolio, getStudioSelection }),
}));

vi.mock(
  "../../../../../../apps/web/src/features/vehicle-create/studio-selection-launcher",
  () => ({
    StudioSelectionLauncher: (props: {
      cancelHref: string;
      context: { mode: string };
      successHref: string;
    }) => (
      <div data-testid="selection-dialog">
        {props.context.mode} cancel:{props.cancelHref} success:{props.successHref}
      </div>
    ),
  }),
);

vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
  redirect: vi.fn(),
}));

const PORTFOLIO_PATH = `/inventory/${PORTFOLIO_TEST_DATA.id}`;

function renderPage(searchParams: Record<string, string> = {}) {
  return VehiclePortfolioPage({
    params: Promise.resolve({ vehicleId: PORTFOLIO_TEST_DATA.id }),
    searchParams: Promise.resolve(searchParams),
  }).then((page) => render(page));
}

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
    await renderPage();

    expect(getPortfolio).toHaveBeenCalledWith("user-1", PORTFOLIO_TEST_DATA.id, null);
    expect(getStudioSelection).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: PORTFOLIO_TEST_DATA.name })).toBeVisible();
    expect(screen.getByRole("slider", { name: "Compare original and processed image" }))
      .toBeVisible();
    expect(screen.queryByRole("region", { name: "Needs your attention" }))
      .not.toBeInTheDocument();
  });

  it("shows the selected studio version", async () => {
    await renderPage({ version: WHITE_VERSION_ID });

    expect(getPortfolio).toHaveBeenCalledWith(
      "user-1",
      PORTFOLIO_TEST_DATA.id,
      WHITE_VERSION_ID,
    );
  });

  it("highlights failed images next to the completed ones", async () => {
    getPortfolio.mockResolvedValue({
      ...PORTFOLIO_TEST_DATA,
      attention: ATTENTION_TEST_DATA,
      status: "NEEDS_ATTENTION",
    });

    await renderPage();

    expect(screen.getByRole("region", { name: "Needs your attention" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Re-process" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Replace" })).toBeVisible();
    expect(screen.getByRole("slider", { name: "Compare original and processed image" }))
      .toBeVisible();
  });

  it("keeps earlier versions visible while a new batch processes", async () => {
    getPortfolio.mockResolvedValue({
      ...PORTFOLIO_TEST_DATA,
      canCreateVersion: false,
      status: "PROCESSING",
    });

    await renderPage();

    expect(screen.getByRole("status")).toHaveTextContent("A new batch is processing");
    expect(screen.getByRole("slider", { name: "Compare original and processed image" }))
      .toBeVisible();
  });

  it("explains an empty gallery when nothing has completed yet", async () => {
    getPortfolio.mockResolvedValue({
      ...PORTFOLIO_TEST_DATA,
      attention: ATTENTION_TEST_DATA,
      images: [],
      selectedVersionId: null,
      status: "NEEDS_ATTENTION",
      versions: [],
    });

    await renderPage();

    expect(screen.getByRole("heading", { name: "No studio images yet" })).toBeVisible();
    expect(screen.getByRole("region", { name: "Needs your attention" })).toBeVisible();
  });

  it.each(["REPROCESS_FAILED", "REPLACE_FAILED"] as const)(
    "opens the Selection Dialog for %s and returns to the portfolio",
    async (studio) => {
      getStudioSelection.mockResolvedValue(failedSelectionContext(studio));

      await renderPage({ studio });

      expect(getStudioSelection).toHaveBeenCalledWith(
        "user-1",
        PORTFOLIO_TEST_DATA.id,
        { mode: studio, versionId: null },
      );
      expect(screen.getByTestId("selection-dialog")).toHaveTextContent(
        `${studio} cancel:${PORTFOLIO_PATH} success:${PORTFOLIO_PATH}`,
      );
    },
  );

  it("returns a cancelled new version to the version it started from", async () => {
    getStudioSelection.mockResolvedValue(failedSelectionContext("CREATE_VARIANT"));

    await renderPage({ studio: "CREATE_VARIANT", version: WHITE_VERSION_ID });

    expect(screen.getByTestId("selection-dialog")).toHaveTextContent(
      `cancel:${PORTFOLIO_PATH}?version=${WHITE_VERSION_ID} success:${PORTFOLIO_PATH}`,
    );
  });

  it("says so when the requested action no longer applies", async () => {
    getStudioSelection.mockResolvedValue(null);

    await renderPage({ studio: "REPROCESS_FAILED" });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "isn't available for this vehicle right now",
    );
    expect(screen.queryByTestId("selection-dialog")).not.toBeInTheDocument();
  });
});
