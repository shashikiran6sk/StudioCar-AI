import { describe, expect, it } from "vitest";

import { formatFloorStyle } from "../../../../apps/web/src/features/vehicle-create/format-floor-style";

describe("formatFloorStyle", () => {
  it("names each floor the way the chooser does", () => {
    expect(formatFloorStyle("PLAIN")).toBe("Plain background");
    expect(formatFloorStyle("HORIZON")).toBe("Standard floor");
  });
});
