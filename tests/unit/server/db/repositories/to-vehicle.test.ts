import { describe, expect, it } from "vitest";

import { toVehicle } from "../../../../../apps/web/src/server/db/repositories/to-vehicle";

describe("toVehicle", () => {
  it("serializes database timestamps without exposing persistence fields", () => {
    expect(
      toVehicle({
        id: "0e879f46-1193-4d77-b785-057fe026d998",
        name: "Porsche 911 Carrera",
        brand: "Porsche",
        model: "911",
        variant: null,
        year: 2026,
        stockId: null,
        internalId: null,
        notes: null,
        status: "DRAFT",
        createdAt: new Date("2026-09-19T12:00:00.000Z"),
        updatedAt: new Date("2026-09-19T12:01:00.000Z"),
      }),
    ).toEqual({
      id: "0e879f46-1193-4d77-b785-057fe026d998",
      name: "Porsche 911 Carrera",
      brand: "Porsche",
      model: "911",
      variant: null,
      year: 2026,
      stockId: null,
      internalId: null,
      notes: null,
      status: "DRAFT",
      createdAt: "2026-09-19T12:00:00.000Z",
      updatedAt: "2026-09-19T12:01:00.000Z",
    });
  });
});
