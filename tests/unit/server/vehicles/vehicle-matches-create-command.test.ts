import { describe, expect, it } from "vitest";

import { vehicleMatchesCreateCommand } from "../../../../apps/web/src/server/vehicles/vehicle-matches-create-command";

const vehicle = {
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
  updatedAt: "2026-09-19T12:00:00.000Z",
} satisfies Parameters<typeof vehicleMatchesCreateCommand>[0];

describe("vehicleMatchesCreateCommand", () => {
  it("treats omitted optional fields as persisted null values", () => {
    expect(
      vehicleMatchesCreateCommand(vehicle, {
        name: "Porsche 911 Carrera",
        brand: "Porsche",
        model: "911",
        year: 2026,
      }),
    ).toBe(true);
  });

  it("rejects a replay whose normalized command differs", () => {
    expect(
      vehicleMatchesCreateCommand(vehicle, {
        name: "Porsche 911 Turbo",
      }),
    ).toBe(false);
  });

  it("ignores a stored legacy internal reference when comparing a replay", () => {
    expect(vehicleMatchesCreateCommand({ ...vehicle, internalId: "LEGACY-1" }, {
      name: "Porsche 911 Carrera",
      brand: "Porsche",
      model: "911",
      year: 2026,
    })).toBe(true);
  });
});
