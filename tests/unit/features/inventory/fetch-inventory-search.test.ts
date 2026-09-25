import { describe, expect, it, vi } from "vitest";

import { fetchInventorySearch } from "../../../../apps/web/src/features/inventory/fetch-inventory-search";

const page = {
  counts: { all: 0, archived: 0, completed: 0, needsAttention: 0, processing: 0 },
  items: [],
  nextCursor: null,
};

describe("fetchInventorySearch", () => {
  it("passes cancellation to fetch and validates the response envelope", async () => {
    const controller = new AbortController();
    const fetcher = vi.fn().mockResolvedValue(Response.json(page));

    await expect(fetchInventorySearch("/api/inventory/search?q=porsche", controller.signal, fetcher))
      .resolves.toEqual(page);
    expect(fetcher).toHaveBeenCalledWith("/api/inventory/search?q=porsche", { signal: controller.signal });
  });

  it("rejects malformed or unsuccessful results", async () => {
    const signal = new AbortController().signal;
    await expect(fetchInventorySearch("/api/inventory/search?q=porsche", signal, vi.fn().mockResolvedValue(Response.json({ items: [] }))))
      .rejects.toThrow();
    await expect(fetchInventorySearch("/api/inventory/search?q=porsche", signal, vi.fn().mockResolvedValue(new Response(null, { status: 503 }))))
      .rejects.toThrow();
  });
});
