import { describe, expect, it } from "vitest";

import { toVehicleUpdateData } from "../../../../packages/database/src/repositories/to-vehicle-update-data";

describe("toVehicleUpdateData", () => {
  it("maps only supplied patch fields", () => {
    expect(
      toVehicleUpdateData({ name: "Updated vehicle", stockId: "SC-001" }),
    ).toEqual({ name: "Updated vehicle", stockId: "SC-001" });
  });
});
