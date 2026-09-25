import { describe, expect, it } from "vitest";

import {
  CreateVehicleResponseSchema,
  CreateVehicleSchema,
  UpdateVehicleSchema,
  VehicleListQuerySchema,
  VehiclePathSchema,
} from "../../../packages/contracts/src/vehicle";

describe("vehicle contracts", () => {
  it("normalizes a valid vehicle command", () => {
    expect(
      CreateVehicleSchema.parse({ name: "  2025 Porsche 911 " }),
    ).toEqual({ name: "2025 Porsche 911" });
    expect(
      CreateVehicleSchema.parse({ name: "2025 Porsche 911", year: "2025" }),
    ).toMatchObject({ year: 2025 });
  });

  it("rejects an empty update and unknown command fields", () => {
    expect(UpdateVehicleSchema.safeParse({}).success).toBe(false);
    expect(
      CreateVehicleSchema.safeParse({ name: "911", ownerId: "forged" }).success,
    ).toBe(false);
    expect(CreateVehicleSchema.safeParse({ name: "911", internalId: "manual" }).success).toBe(false);
    expect(UpdateVehicleSchema.safeParse({ internalId: "manual" }).success).toBe(false);
  });

  it("keeps inventory query bounds server-controlled", () => {
    expect(VehicleListQuerySchema.parse({})).toEqual({
      limit: 24,
      sort: "CREATED_DESC",
    });
  });

  it("validates vehicle paths and serialized draft responses", () => {
    const vehicleId = "0e879f46-1193-4d77-b785-057fe026d998";
    expect(VehiclePathSchema.parse({ vehicleId })).toEqual({ vehicleId });
    expect(
      CreateVehicleResponseSchema.parse({
        replayed: false,
        vehicle: {
          id: vehicleId,
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
        },
      }),
    ).toMatchObject({ replayed: false, vehicle: { id: vehicleId } });
  });
});
