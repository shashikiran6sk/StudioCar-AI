import { describe, expect, it } from "vitest";

import { formatAdminDate } from "../../../../apps/web/src/features/admin/format-admin-date";

describe("formatAdminDate", () => {
  it("formats an ISO date readably", () => {
    expect(formatAdminDate("2026-09-22T10:00:00.000Z")).toMatch(/2026/);
  });

  it("returns nothing for an unparseable value rather than Invalid Date", () => {
    expect(formatAdminDate("not-a-date")).toBe("");
  });
});
