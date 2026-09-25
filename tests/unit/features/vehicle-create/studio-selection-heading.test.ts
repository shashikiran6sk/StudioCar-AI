import { describe, expect, it } from "vitest";

import { studioSelectionHeading } from "../../../../apps/web/src/features/vehicle-create/studio-selection-heading";
import { VehicleCreateStep } from "../../../../apps/web/src/features/vehicle-create/vehicle-create-step";

describe("studioSelectionHeading", () => {
  it("keeps the four-step new-vehicle heading", () => {
    expect(studioSelectionHeading(VehicleCreateStep.Photos, undefined)).toEqual({
      description:
        "Create a vehicle, upload its photos, and choose a studio treatment.",
      eyebrow: "New vehicle batch",
      photosNote: undefined,
      step: { current: 2, labels: ["Vehicle", "Photos", "Studio", "Review"], total: 4 },
      title: "Upload photos",
    });
  });

  it("counts three steps for an existing vehicle and names the mode", () => {
    expect(
      studioSelectionHeading(VehicleCreateStep.Photos, "CREATE_VARIANT"),
    ).toMatchObject({
      eyebrow: "New studio version",
      step: { current: 1, total: 3 },
      title: "Choose photos",
    });
    expect(
      studioSelectionHeading(VehicleCreateStep.Review, "REPROCESS_FAILED"),
    ).toMatchObject({
      eyebrow: "Re-process failed images",
      step: { current: 3, total: 3 },
      title: "Review & process",
    });
    expect(
      studioSelectionHeading(VehicleCreateStep.Customize, "REPLACE_FAILED"),
    ).toMatchObject({
      eyebrow: "Replace failed images",
      step: { current: 2, total: 3 },
      title: "Customize treatment",
    });
  });
});
