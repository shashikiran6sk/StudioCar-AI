import { describe, expect, it } from "vitest";

import { formatInventoryImageCount } from "../../../../apps/web/src/features/inventory/format-inventory-image-count";

describe("formatInventoryImageCount", () => {
  it("uses a grammatically correct inventory image label", () => {
    expect(formatInventoryImageCount(1)).toBe("1 image");
    expect(formatInventoryImageCount(20)).toBe("20 images");
  });
});
