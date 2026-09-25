import { describe, expect, it, vi } from "vitest";

import { handleSearchInventory } from "../../../../apps/web/src/server/inventory/search-inventory-handler";
import type { ActiveSession } from "../../../../apps/web/src/server/auth/session-service";
import type { InventorySearchApplication } from "../../../../apps/web/src/server/inventory/inventory.types";

const session: ActiveSession = {
  expiresAt: new Date("2026-10-19T00:00:00.000Z"),
  id: "session-1",
  user: {
    displayName: null,
    id: "owner-1",
    primaryEmail: "owner@example.test",
    primaryPhone: null,
  },
  userId: "owner-1",
};
const page = {
  counts: { all: 1, archived: 0, completed: 1, needsAttention: 0, processing: 0 },
  items: [],
  nextCursor: null,
};

describe("handleSearchInventory", () => {
  it("passes a validated term and status to the tenant scoped service", async () => {
    const inventory: InventorySearchApplication = {
      list: vi.fn(),
      search: vi.fn().mockResolvedValue(page),
    };
    const response = await handleSearchInventory(
      new Request("https://app.example.test/api/inventory/search?q=%20porsche%20&status=COMPLETED"),
      session,
      inventory,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(await response.json()).toEqual(page);
    expect(inventory.search).toHaveBeenCalledWith("owner-1", {
      limit: 24,
      mode: "BROWSE",
      q: "porsche",
      sort: "CREATED_DESC",
      status: "COMPLETED",
    });
  });

  it("rejects an empty search and never calls the service", async () => {
    const inventory: InventorySearchApplication = { list: vi.fn(), search: vi.fn() };
    const response = await handleSearchInventory(
      new Request("https://app.example.test/api/inventory/search?q="),
      session,
      inventory,
      () => "request-1234",
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: { code: "BAD_REQUEST", fieldErrors: { q: expect.any(Array) } },
    });
    expect(inventory.search).not.toHaveBeenCalled();
  });

  it("requires a session", async () => {
    const inventory: InventorySearchApplication = { list: vi.fn(), search: vi.fn() };
    const response = await handleSearchInventory(
      new Request("https://app.example.test/api/inventory/search?q=porsche"),
      null,
      inventory,
      () => "request-1234",
    );

    expect(response.status).toBe(401);
    expect(inventory.search).not.toHaveBeenCalled();
  });
});
