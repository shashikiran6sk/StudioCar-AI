import { describe, expect, it } from "vitest";

import { toVehicleCreateData } from "../../../../packages/database/src/repositories/to-vehicle-create-data";

describe("toVehicleCreateData", () => {
  it("includes supplied optional values and an optional request key", () => {
    expect(
      toVehicleCreateData(
        "user-1",
        { name: "Porsche 911", year: 2026 },
        "vehicle-request-0001",
      ),
    ).toEqual({
      userId: "user-1",
      creationIdempotencyKey: "vehicle-request-0001",
      name: "Porsche 911",
      year: 2026,
    });
  });
});
