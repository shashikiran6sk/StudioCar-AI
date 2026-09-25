import { describe, expect, it } from "vitest";

import { toVehicleDetailsValues } from "../../../../apps/web/src/features/vehicle-create/to-vehicle-details-values";
import { selectionContext } from "./studio-selection-test-data";

describe("toVehicleDetailsValues", () => {
  it("fills the review step's fields from an existing vehicle", () => {
    expect(toVehicleDetailsValues(selectionContext().vehicle)).toEqual({
      brand: "BMW",
      internalId: "",
      model: "X1",
      name: "2024 BMW X1",
      notes: "",
      stockId: "SC-1",
      variant: "",
      year: "2024",
    });
  });

  it("uses empty text for identity the vehicle does not have", () => {
    expect(
      toVehicleDetailsValues({
        ...selectionContext().vehicle,
        brand: null,
        model: null,
        stockId: null,
        year: null,
      }),
    ).toMatchObject({ brand: "", model: "", stockId: "", year: "" });
  });
});
