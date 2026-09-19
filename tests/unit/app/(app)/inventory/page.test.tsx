import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import InventoryPage from "../../../../../apps/web/src/app/(app)/inventory/page";
import { getCurrentSession } from "../../../../../apps/web/src/server/auth/get-current-session";

const listInventory = vi.hoisted(() => vi.fn());

vi.mock("../../../../../apps/web/src/server/auth/get-current-session", () => ({
  getCurrentSession: vi.fn(),
}));

vi.mock("../../../../../apps/web/src/server/inventory/inventory-runtime", () => ({
  getInventoryService: () => ({ list: listInventory }),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

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
  });

  it("renders authorized server-owned inventory and URL filter state", async () => {
    listInventory.mockResolvedValue({
      counts: { all: 1, archived: 0, completed: 1, failed: 0, processing: 0 },
      items: [
        {
          brand: "BMW",
          completedImageCount: 20,
          createdAt: "2026-09-18T10:00:00.000Z",
          failedImageCount: 0,
          id: "4bb7fa89-c907-4458-9786-8aafc2235728",
          imageCount: 20,
          model: "3 Series",
          name: "2026 BMW 3 Series",
          previewUrl: null,
          status: "COMPLETED",
          stockId: "SC-100",
          year: 2026,
        },
      ],
      nextCursor: null,
    });

    const page = await InventoryPage({
      searchParams: Promise.resolve({ query: "BMW" }),
    });
    render(page);

    expect(listInventory).toHaveBeenCalledWith("user-1", {
      filter: "ALL",
      limit: 24,
      query: "BMW",
      sort: "CREATED_DESC",
      view: "GRID",
    });
    expect(screen.getByRole("heading", { name: "Inventory", level: 1 }))
      .toBeVisible();
    expect(screen.getByRole("heading", { name: "2026 BMW 3 Series" }))
      .toBeVisible();
  });

  it("renders the fixed first-vehicle empty state", async () => {
    listInventory.mockResolvedValue({
      counts: { all: 0, archived: 0, completed: 0, failed: 0, processing: 0 },
      items: [],
      nextCursor: null,
    });

    const page = await InventoryPage({ searchParams: Promise.resolve({}) });
    render(page);

    expect(screen.getByRole("heading", { name: "Your inventory is empty" }))
      .toBeVisible();
  });
});
