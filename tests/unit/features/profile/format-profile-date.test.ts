import { describe, expect, it } from "vitest";

import { formatProfileDate } from "../../../../apps/web/src/features/profile/format-profile-date";

describe("formatProfileDate", () => {
  it("formats account timestamps with date and time", () => {
    const formatted = formatProfileDate(new Date(2026, 8, 19, 14, 30));

    expect(formatted).toContain("19 Sept 2026");
    expect(formatted).toContain("2:30 pm");
  });
});
