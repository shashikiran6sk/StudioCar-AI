import { describe, expect, it } from "vitest";

import { formatPhotoCount } from "../../../../apps/web/src/features/vehicle-create/format-photo-count";

describe("formatPhotoCount", () => {
  it("uses singular and plural photo labels", () => {
    expect(formatPhotoCount(1)).toBe("1 photo");
    expect(formatPhotoCount(3)).toBe("3 photos");
  });
});
