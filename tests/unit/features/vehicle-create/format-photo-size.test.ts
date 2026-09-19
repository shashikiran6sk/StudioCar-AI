import { describe, expect, it } from "vitest";

import { formatPhotoSize } from "../../../../apps/web/src/features/vehicle-create/format-photo-size";

describe("formatPhotoSize", () => {
  it("formats byte sizes as compact megabytes", () => {
    expect(formatPhotoSize(4_194_304)).toBe("4.0 MB");
  });
});
