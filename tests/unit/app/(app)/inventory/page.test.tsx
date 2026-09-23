import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import InventoryPage from "../../../../../apps/web/src/app/(app)/inventory/page";
import { getCurrentSession } from "../../../../../apps/web/src/server/auth/get-current-session";
import { selectionContext } from "../../../features/vehicle-create/studio-selection-test-data";

const listInventory = vi.hoisted(() => vi.fn());
const getStudioSelection = vi.hoisted(() => vi.fn());

vi.mock("../../../../../apps/web/src/server/auth/get-current-session", () => ({
  getCurrentSession: vi.fn(),
}));

vi.mock("../../../../../apps/web/src/server/inventory/inventory-runtime", () => ({
  getInventoryService: () => ({ list: listInventory }),
}));

vi.mock("../../../../../apps/web/src/server/portfolio/portfolio-runtime", () => ({
  getPortfolioService: () => ({ getStudioSelection }),
}));

vi.mock(
  "../../../../../apps/web/src/features/vehicle-create/studio-selection-launcher",
  () => ({
    StudioSelectionLauncher: (props: {
      cancelHref: string;
      context: { mode: string; vehicle: { name: string } };
      successHref: string;
    }) => (
      <div data-testid="selection-dialog">
        {props.context.mode} {props.context.vehicle.name} cancel:{props.cancelHref}{" "}
        success:{props.successHref}
      </div>
    ),
  }),
);

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const VEHICLE_ID = "4bb7fa89-c907-4458-9786-8aafc2235728";
const COUNTS = {
  all: 1,
  archived: 0,
  completed: 1,
  needsAttention: 0,
  processing: 0,
};
const ITEM = {
  brand: "BMW",
  completedImageCount: 20,
  createdAt: "2026-09-18T10:00:00.000Z",
  failedImageCount: 0,
  hasCompletedOutput: true,
  id: VEHICLE_ID,
  imageCount: 20,
  model: "3 Series",
  name: "2026 BMW 3 Series",
  previewUrl: null,
  status: "COMPLETED",
  stockId: "SC-100",
  year: 2026,
};

describe("InventoryPage", () => {
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
    listInventory.mockResolvedValue({
      counts: COUNTS,
      items: [ITEM],
      nextCursor: null,
    });
  });

  it("renders authorized server-owned inventory and URL filter state", async () => {
    const page = await InventoryPage({
      searchParams: Promise.resolve({ query: "BMW" }),
    });
    render(page);

    expect(listInventory).toHaveBeenCalledWith("user-1", {
      filter: "ALL",
      limit: 24,
      mode: "BROWSE",
      query: "BMW",
      sort: "CREATED_DESC",
      view: "GRID",
    });
    expect(screen.getByRole("heading", { name: "Inventory", level: 1 }))
      .toBeVisible();
    expect(screen.getByRole("heading", { name: "2026 BMW 3 Series" }))
      .toBeVisible();
    expect(screen.getByRole("link", { name: /Open portfolio/ })).toBeVisible();
    expect(getStudioSelection).not.toHaveBeenCalled();
  });

  it("filters to the vehicles that need attention", async () => {
    listInventory.mockResolvedValue({
      counts: { ...COUNTS, needsAttention: 1 },
      items: [{ ...ITEM, failedImageCount: 2, status: "FAILED" }],
      nextCursor: null,
    });

    const page = await InventoryPage({
      searchParams: Promise.resolve({ filter: "NEEDS_ATTENTION" }),
    });
    render(page);

    expect(listInventory).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ filter: "NEEDS_ATTENTION" }),
    );
    expect(screen.getByRole("link", { name: "Needs attention 1" }))
      .toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /Review issues/ })).toHaveAttribute(
      "href",
      `/inventory/${VEHICLE_ID}#attention`,
    );
  });

  it("lists vehicles to choose from when creating studio images", async () => {
    const page = await InventoryPage({
      searchParams: Promise.resolve({ mode: "CREATE_STUDIO" }),
    });
    render(page);

    expect(listInventory).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ mode: "CREATE_STUDIO" }),
    );
    expect(screen.getByRole("heading", { name: "Choose a vehicle", level: 1 }))
      .toBeVisible();
    expect(screen.queryByRole("navigation", { name: "Inventory status" }))
      .not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to inventory" }))
      .toHaveAttribute("href", "/inventory");
    expect(screen.getByRole("link", { name: /Create images/ })).toHaveAttribute(
      "href",
      `/inventory?mode=CREATE_STUDIO&vehicle=${VEHICLE_ID}`,
    );
    expect(screen.queryByTestId("selection-dialog")).not.toBeInTheDocument();
  });

  it("opens the Selection Dialog on the chosen vehicle and returns to the choice on cancel", async () => {
    getStudioSelection.mockResolvedValue(selectionContext());

    const page = await InventoryPage({
      searchParams: Promise.resolve({ mode: "CREATE_STUDIO", vehicle: VEHICLE_ID }),
    });
    render(page);

    expect(getStudioSelection).toHaveBeenCalledWith("user-1", VEHICLE_ID, {
      mode: "CREATE_VARIANT",
      versionId: null,
    });
    expect(screen.getByTestId("selection-dialog")).toHaveTextContent(
      "CREATE_VARIANT 2024 BMW X1 cancel:/inventory?mode=CREATE_STUDIO success:/inventory",
    );
  });

  it("explains when the chosen vehicle cannot get a new version", async () => {
    getStudioSelection.mockResolvedValue(null);

    const page = await InventoryPage({
      searchParams: Promise.resolve({ mode: "CREATE_STUDIO", vehicle: VEHICLE_ID }),
    });
    render(page);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "isn't available for this vehicle right now",
    );
    expect(screen.queryByTestId("selection-dialog")).not.toBeInTheDocument();
  });

  it("ignores a vehicle outside the create-studio mode", async () => {
    const page = await InventoryPage({
      searchParams: Promise.resolve({ vehicle: VEHICLE_ID }),
    });
    render(page);

    expect(getStudioSelection).not.toHaveBeenCalled();
  });

  it("renders the fixed first-vehicle empty state", async () => {
    listInventory.mockResolvedValue({
      counts: { ...COUNTS, all: 0, completed: 0 },
      items: [],
      nextCursor: null,
    });

    const page = await InventoryPage({ searchParams: Promise.resolve({}) });
    render(page);

    expect(screen.getByRole("heading", { name: "Your inventory is empty" }))
      .toBeVisible();
  });
});
