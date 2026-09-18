import { describe, expect, it } from "vitest";

import {
  CreateVehicleSchema,
  UpdateVehicleSchema,
  VehicleListQuerySchema,
} from "../../../packages/contracts/src/vehicle";

describe("vehicle contracts", () => {
  it("normalizes a valid vehicle command", () => {
    expect(
      CreateVehicleSchema.parse({ name: "  2025 Porsche 911 ", year: "2025" }),
    ).toMatchObject({ name: "2025 Porsche 911", year: 2025 });
  });

  it("rejects an empty update and unknown command fields", () => {
    expect(UpdateVehicleSchema.safeParse({}).success).toBe(false);
    expect(
      CreateVehicleSchema.safeParse({ name: "911", ownerId: "forged" }).success,
    ).toBe(false);
  });

  it("keeps inventory query bounds server-controlled", () => {
    expect(VehicleListQuerySchema.parse({})).toEqual({
      limit: 24,
      sort: "CREATED_DESC",
    });
  });
});
