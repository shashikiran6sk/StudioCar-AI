import { describe, expect, it } from "vitest";

import { imageDimensionsAreSafe } from "../../../../../apps/web/src/server/uploads/image-validation/image-dimensions-are-safe";

describe("imageDimensionsAreSafe", () => {
  it("enforces per-axis and total-pixel decompression limits", () => {
    expect(
      imageDimensionsAreSafe(
        { mimeType: "image/jpeg", width: 4000, height: 3000 },
        16_384,
        100_000_000,
      ),
    ).toBe(true);
    expect(
      imageDimensionsAreSafe(
        { mimeType: "image/jpeg", width: 20_000, height: 100 },
        16_384,
        100_000_000,
      ),
    ).toBe(false);
    expect(
      imageDimensionsAreSafe(
        { mimeType: "image/jpeg", width: 12_000, height: 12_000 },
        16_384,
        100_000_000,
      ),
    ).toBe(false);
  });
});
