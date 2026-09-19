import { describe, expect, it } from "vitest";

import { parseVehicleDetails } from "../../../../apps/web/src/features/vehicle-create/parse-vehicle-details";

describe("parseVehicleDetails", () => {
  it("normalizes populated values and omits blank optional fields", () => {
    expect(
      parseVehicleDetails({
        name: "  Porsche 911 Carrera  ",
        brand: " Porsche ",
        model: "911",
        variant: "",
        year: "2026",
        stockId: "",
        internalId: "",
        notes: "",
      }),
    ).toEqual({
      success: true,
      command: {
        name: "Porsche 911 Carrera",
        brand: "Porsche",
        model: "911",
        year: 2026,
      },
    });
  });

  it("returns field errors for invalid details", () => {
    expect(
      parseVehicleDetails({
        name: "",
        brand: "",
        model: "",
        variant: "",
        year: "1800",
        stockId: "",
        internalId: "",
        notes: "",
      }),
    ).toMatchObject({
      success: false,
      fieldErrors: { name: expect.any(Array), year: expect.any(Array) },
    });
  });
});
