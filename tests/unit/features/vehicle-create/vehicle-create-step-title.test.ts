import { describe, expect, it } from "vitest";

import { VehicleCreateStep } from "../../../../apps/web/src/features/vehicle-create/vehicle-create-step";
import { vehicleCreateStepTitle } from "../../../../apps/web/src/features/vehicle-create/vehicle-create-step-title";

describe("vehicleCreateStepTitle", () => {
  it("returns the screenshot title for each wizard step", () => {
    expect(vehicleCreateStepTitle(VehicleCreateStep.Details)).toBe(
      "Vehicle details",
    );
    expect(vehicleCreateStepTitle(VehicleCreateStep.Photos)).toBe(
      "Upload photos",
    );
    expect(vehicleCreateStepTitle(VehicleCreateStep.Customize)).toBe(
      "Customize treatment",
    );
    expect(vehicleCreateStepTitle(VehicleCreateStep.Review)).toBe(
      "Review & process",
    );
  });
});
