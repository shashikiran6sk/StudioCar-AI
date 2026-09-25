import { describe, expect, it } from "vitest";

import { vehicleReviewMetadata } from "../../../../apps/web/src/features/vehicle-create/vehicle-review-metadata";

describe("vehicleReviewMetadata", () => {
  it("omits empty optional fields and prefixes the stock reference", () => {
    expect(
      vehicleReviewMetadata({
        brand: " BMW ",
        internalId: "",
        model: "3 Series",
        name: "2022 BMW 3 Series",
        notes: "",
        stockId: "NL-3429",
        variant: "",
        year: "2022",
      }),
    ).toBe("BMW · 3 Series · Stock NL-3429");
  });
});
