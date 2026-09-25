import { act, fireEvent, render, screen } from "@testing-library/react";
import type { InventoryItem, InventoryPage, InventoryQuery } from "../../../../packages/contracts/src/inventory";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { InventoryExplorer } from "../../../../apps/web/src/features/inventory/inventory-explorer";

const fetchInventorySearch = vi.hoisted(() => vi.fn());
const replace = vi.hoisted(() => vi.fn());
vi.mock("../../../../apps/web/src/features/inventory/fetch-inventory-search", () => ({ fetchInventorySearch }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace }) }));

const BMW_ID = "4bb7fa89-c907-4458-9786-8aafc2235728";
const PORSCHE_ID = "a840b5b7-0704-4751-acd0-dfc644445fc4";
const item = (id: string, name: string): InventoryItem => ({
  brand: null,
  completedImageCount: 1,
  createdAt: "2026-09-25T10:00:00.000Z",
  failedImageCount: 0,
  hasCompletedOutput: true,
  id,
  imageCount: 1,
  model: null,
  name,
  previewUrl: null,
  status: "COMPLETED",
  stockId: null,
  year: null,
});
const initialPage: InventoryPage = {
  counts: { all: 1, archived: 0, completed: 1, needsAttention: 0, processing: 0 },
  items: [item(BMW_ID, "2026 BMW 3 Series")],
  nextCursor: null,
};
const porschePage: InventoryPage = {
  counts: { all: 1, archived: 0, completed: 1, needsAttention: 0, processing: 0 },
  items: [item(PORSCHE_ID, "2025 Porsche 911 Carrera")],
  nextCursor: null,
};
const query: InventoryQuery = {
  filter: "ALL",
  limit: 24,
  mode: "BROWSE",
  sort: "CREATED_DESC",
  view: "GRID",
};

async function advanceDebounce() {
  await act(async () => {
    vi.advanceTimersByTime(400);
    await Promise.resolve();
  });
}

describe("InventoryExplorer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    fetchInventorySearch.mockReset();
    replace.mockReset();
    window.history.replaceState(null, "", "/inventory");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("waits 400 ms after typing, uses search, and restores the normal list immediately on clear", async () => {
    fetchInventorySearch.mockResolvedValue(porschePage);
    render(<InventoryExplorer choosing={false} initialPage={initialPage} query={query} />);
    const input = screen.getByRole("searchbox", { name: "Search vehicles by name or reference" });

    for (const value of ["p", "po", "por", "pors", "porsche"]) {
      fireEvent.change(input, { target: { value } });
    }
    expect(screen.queryByRole("button", { name: "Apply" })).not.toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Searching vehicles…" })).toBeVisible();
    expect(fetchInventorySearch).not.toHaveBeenCalled();
    await act(async () => vi.advanceTimersByTime(399));
    expect(fetchInventorySearch).not.toHaveBeenCalled();
    await act(async () => vi.advanceTimersByTime(1));
    expect(fetchInventorySearch).toHaveBeenCalledTimes(1);
    expect(fetchInventorySearch.mock.calls[0]?.[0]).toBe("/api/inventory/search?q=porsche");
    await act(async () => Promise.resolve());
    expect(screen.getByRole("heading", { name: "2025 Porsche 911 Carrera" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(screen.getByRole("heading", { name: "2026 BMW 3 Series" })).toBeVisible();
    expect(fetchInventorySearch).toHaveBeenCalledTimes(1);

    fireEvent.change(input, { target: { value: "porsche" } });
    expect(fetchInventorySearch).toHaveBeenCalledTimes(1);
    await advanceDebounce();
    expect(fetchInventorySearch).toHaveBeenCalledTimes(2);
  });

  it("shows search-specific empty copy and a reset action", async () => {
    fetchInventorySearch.mockResolvedValue({ ...porschePage, items: [], counts: { ...porschePage.counts, all: 0, completed: 0 } });
    render(<InventoryExplorer choosing={false} initialPage={initialPage} query={query} />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "unknown" } });
    await advanceDebounce();

    expect(screen.getByRole("heading", { name: "No vehicles found for 'unknown'" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Your inventory is empty" })).not.toBeInTheDocument();
    const clear = screen.getAllByRole("button", { name: "Clear search" })[1];
    if (!clear) throw new Error("Search reset action is missing.");
    fireEvent.click(clear);
    expect(screen.getByRole("heading", { name: "2026 BMW 3 Series" })).toBeVisible();
  });

  it("does not let an older response replace a newer search", async () => {
    let resolveOld: (page: InventoryPage) => void = () => undefined;
    const oldResult = new Promise<InventoryPage>((resolve) => { resolveOld = resolve; });
    fetchInventorySearch.mockImplementation((url: string) => url.endsWith("q=por") ? oldResult : Promise.resolve(porschePage));
    render(<InventoryExplorer choosing={false} initialPage={initialPage} query={query} />);
    const input = screen.getByRole("searchbox");

    fireEvent.change(input, { target: { value: "por" } });
    await advanceDebounce();
    fireEvent.change(input, { target: { value: "porsche" } });
    await advanceDebounce();
    await act(async () => Promise.resolve());
    expect(fetchInventorySearch.mock.calls.map((call) => call[0])).toEqual([
      "/api/inventory/search?q=por",
      "/api/inventory/search?q=porsche",
    ]);
    expect(screen.getByRole("heading", { name: "2025 Porsche 911 Carrera" })).toBeVisible();

    await act(async () => resolveOld({ ...initialPage, items: [item(BMW_ID, "Old por result")] }));
    expect(screen.getByRole("heading", { name: "2025 Porsche 911 Carrera" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Old por result" })).not.toBeInTheDocument();
  });

  it("keeps the term when filtering and searches completed matches after navigation", async () => {
    fetchInventorySearch.mockResolvedValue(porschePage);
    const { rerender } = render(<InventoryExplorer choosing={false} initialPage={initialPage} query={query} />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "porsche" } });
    await advanceDebounce();
    expect(screen.getByRole("link", { name: "Completed 1" })).toHaveAttribute("href", "/inventory?query=porsche&filter=COMPLETED");

    rerender(<InventoryExplorer key="completed" choosing={false} initialPage={initialPage} query={{ ...query, filter: "COMPLETED", query: "porsche" }} />);
    await act(async () => Promise.resolve());
    expect(fetchInventorySearch.mock.calls.at(-1)?.[0]).toBe("/api/inventory/search?q=porsche&status=COMPLETED");
  });
});
