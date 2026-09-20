import { describe, expect, it } from "vitest";

import { formatStorageSize } from "../../../../apps/web/src/features/dashboard/format-storage-size";

describe("formatStorageSize", () => {
  it("formats gigabytes and megabytes without overstating empty usage", () => {
    expect(formatStorageSize(1_288_490_189)).toBe("1.2 GB");
    expect(formatStorageSize(52_428_800)).toBe("50.0 MB");
    expect(formatStorageSize(1_024)).toBe("0 GB");
  });
});
