import { describe, expect, it } from "vitest";

import {
  InventoryPageSchema,
  InventoryQuerySchema,
  InventorySearchQuerySchema,
} from "../../../packages/contracts/src/inventory";

describe("InventoryQuerySchema", () => {
  it("normalizes defaults and validates shareable inventory state", () => {
    expect(InventoryQuerySchema.parse({})).toEqual({
      filter: "ALL",
      limit: 24,
      mode: "BROWSE",
      sort: "CREATED_DESC",
      view: "GRID",
    });
    expect(
      InventoryQuerySchema.parse({
        filter: "NEEDS_ATTENTION",
        limit: "12",
        query: "  Audi  ",
        sort: "NAME_ASC",
        view: "LIST",
      }),
    ).toMatchObject({
      filter: "NEEDS_ATTENTION",
      limit: 12,
      query: "Audi",
      sort: "NAME_ASC",
      view: "LIST",
    });
  });

  it("rejects unsupported filters and unbounded pages", () => {
    expect(
      InventoryQuerySchema.safeParse({ filter: "FAVOURITE" }).success,
    ).toBe(false);
    expect(InventoryQuerySchema.safeParse({ filter: "FAILED" }).success).toBe(false);
    expect(InventoryQuerySchema.safeParse({ mode: "PICK" }).success).toBe(false);
    expect(InventoryQuerySchema.safeParse({ limit: 101 }).success).toBe(false);
  });
});

describe("InventorySearchQuerySchema", () => {
  it("requires a bounded nonempty term and normalizes status and sort", () => {
    expect(InventorySearchQuerySchema.parse({ q: "  PorSche  ", status: "COMPLETED" })).toEqual({
      limit: 24,
      mode: "BROWSE",
      q: "PorSche",
      sort: "CREATED_DESC",
      status: "COMPLETED",
    });
    expect(InventorySearchQuerySchema.safeParse({ q: " " }).success).toBe(false);
    expect(InventorySearchQuerySchema.safeParse({ q: "x".repeat(101) }).success).toBe(false);
    expect(InventorySearchQuerySchema.safeParse({ q: "car", status: "UNKNOWN" }).success).toBe(false);
  });
});

describe("InventoryQuerySchema mode", () => {
  it("accepts the create-studio selection mode", () => {
    expect(InventoryQuerySchema.parse({ mode: "CREATE_STUDIO" }).mode).toBe(
      "CREATE_STUDIO",
    );
  });
});

describe("InventoryPageSchema", () => {
  it("requires signed preview URLs and nonnegative aggregate counts", () => {
    const result = InventoryPageSchema.safeParse({
      counts: {
        all: 1,
        archived: 0,
        completed: 1,
        needsAttention: 0,
        processing: 0,
      },
      items: [
        {
          brand: "BMW",
          completedImageCount: 1,
          createdAt: "2026-09-19T10:00:00.000Z",
          failedImageCount: 0,
          hasCompletedOutput: true,
          id: "4bb7fa89-c907-4458-9786-8aafc2235728",
          imageCount: 1,
          model: "3 Series",
          name: "2026 BMW 3 Series",
          previewUrl: "https://signed.example/preview.webp",
          status: "COMPLETED",
          stockId: "SC-100",
          year: 2026,
        },
      ],
      nextCursor: null,
    });

    expect(result.success).toBe(true);
  });
});
