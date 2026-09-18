import { describe, expect, it } from "vitest";

import { CursorPaginationSchema, IsoDateTimeSchema } from "../../../packages/contracts/src/common";

describe("common contracts", () => {
  it("applies safe pagination defaults and limits", () => {
    expect(CursorPaginationSchema.parse({})).toEqual({ limit: 24 });
    expect(CursorPaginationSchema.safeParse({ limit: 101 }).success).toBe(false);
  });

  it("accepts offset-aware timestamps", () => {
    expect(IsoDateTimeSchema.parse("2026-09-18T10:30:00+05:30")).toBe(
      "2026-09-18T10:30:00+05:30",
    );
  });
});
