import { describe, expect, it } from "vitest";

import { formatInventoryDate } from "../../../../apps/web/src/features/inventory/format-inventory-date";

describe("formatInventoryDate", () => {
  it("uses the compact screenshot date format deterministically", () => {
    expect(formatInventoryDate("2026-09-18T23:30:00.000Z")).toBe("Sep 18, 2026");
  });
});
