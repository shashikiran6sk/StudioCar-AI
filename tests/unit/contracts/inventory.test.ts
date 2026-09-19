import { describe, expect, it } from "vitest";

import {
  InventoryPageSchema,
  InventoryQuerySchema,
} from "../../../packages/contracts/src/inventory";

describe("InventoryQuerySchema", () => {
  it("normalizes defaults and validates shareable inventory state", () => {
    expect(InventoryQuerySchema.parse({})).toEqual({
      filter: "ALL",
      limit: 24,
      sort: "CREATED_DESC",
      view: "GRID",
    });
    expect(
      InventoryQuerySchema.parse({
        filter: "FAILED",
        limit: "12",
        query: "  Audi  ",
        sort: "NAME_ASC",
        view: "LIST",
      }),
    ).toMatchObject({
      filter: "FAILED",
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
    expect(InventoryQuerySchema.safeParse({ limit: 101 }).success).toBe(false);
  });
});

describe("InventoryPageSchema", () => {
  it("requires signed preview URLs and nonnegative aggregate counts", () => {
    const result = InventoryPageSchema.safeParse({
      counts: {
        all: 1,
        archived: 0,
        completed: 1,
        failed: 0,
        processing: 0,
      },
      items: [
        {
          brand: "BMW",
          completedImageCount: 1,
          createdAt: "2026-09-19T10:00:00.000Z",
          failedImageCount: 0,
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
