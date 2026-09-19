import { describe, expect, it } from "vitest";

import { formatBackgroundTreatment } from "../../../../apps/web/src/features/vehicle-create/format-background-treatment";

describe("formatBackgroundTreatment", () => {
  it("maps normalized domain values to review labels", () => {
    expect(formatBackgroundTreatment("PREMIUM_WHITE")).toBe("Premium White");
    expect(formatBackgroundTreatment("ORIGINAL")).toBe("Original");
  });
});
