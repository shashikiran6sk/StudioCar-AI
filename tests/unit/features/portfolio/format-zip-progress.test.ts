import { describe, expect, it } from "vitest";

import { formatZipProgress } from "../../../../apps/web/src/features/portfolio/format-zip-progress";

describe("formatZipProgress", () => {
  it("counts images received out of the total", () => {
    expect(formatZipProgress(3, 8)).toBe("Preparing ZIP… 3 of 8");
  });
});
