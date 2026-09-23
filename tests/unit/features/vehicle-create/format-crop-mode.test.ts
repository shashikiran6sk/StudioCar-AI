import { describe, expect, it } from "vitest";

import { formatCropMode } from "../../../../apps/web/src/features/vehicle-create/format-crop-mode";

describe("formatCropMode", () => {
  it("names each composition choice", () => {
    expect(formatCropMode("MAINTAIN_COMPOSITION")).toBe("Maintained");
    expect(formatCropMode("FIT_VEHICLE")).toBe("Fit to vehicle");
    expect(formatCropMode("SQUARE")).toBe("Square");
  });
});
