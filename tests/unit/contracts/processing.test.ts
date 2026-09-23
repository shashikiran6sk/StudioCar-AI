import { describe, expect, it } from "vitest";

import {
  ProcessingOptionsSchema,
  STUDIO_FLOOR_IDS_BY_BACKGROUND,
  StudioBackgroundIdSchema,
  StudioFloorIdSchema,
  StudioTreatmentSchema,
  type StudioTreatment,
} from "../../../packages/contracts/src/processing";

const VALID_COMBINATIONS: [StudioTreatment["backgroundId"], StudioTreatment["floorId"]][] = [
  ["PREMIUM_WHITE", "WHITE_STUDIO"],
  ["PREMIUM_WHITE", "WHITE_TURNTABLE"],
  ["DARK_STUDIO", "DARK_STUDIO_FLOOR"],
  ["DARK_STUDIO", "DARK_TURNTABLE"],
  ["GREY_STUDIO", "GREY_STUDIO_FLOOR"],
  ["GREY_STUDIO", "GREY_TURNTABLE"],
];

describe("processing contracts", () => {
  it("offers exactly three studio backgrounds with two floors each", () => {
    expect(StudioBackgroundIdSchema.options).toEqual([
      "PREMIUM_WHITE",
      "DARK_STUDIO",
      "GREY_STUDIO",
    ]);
    expect(StudioFloorIdSchema.options).toHaveLength(6);
    for (const floors of Object.values(STUDIO_FLOOR_IDS_BY_BACKGROUND)) {
      expect(floors).toHaveLength(2);
    }
  });

  it("no longer knows Dealership or Custom", () => {
    for (const backgroundId of ["DEALERSHIP", "CUSTOM"]) {
      expect(
        ProcessingOptionsSchema.safeParse({ backgroundId }).success,
      ).toBe(false);
    }
    expect(
      ProcessingOptionsSchema.safeParse({
        backgroundId: "PREMIUM_WHITE",
        customBackgroundAssetId: "4f9d4891-157f-49ed-aa5a-c026abc0a768",
        floorId: "WHITE_STUDIO",
      }).success,
    ).toBe(false);
  });

  it.each(VALID_COMBINATIONS)(
    "accepts %s with its own floor %s and keeps both IDs",
    (backgroundId, floorId) => {
      const options = ProcessingOptionsSchema.parse({ backgroundId, floorId });

      expect(options).toMatchObject({ backgroundId, floorId });
    },
  );

  it("refuses a floor that belongs to another background", () => {
    const result = ProcessingOptionsSchema.safeParse({
      backgroundId: "PREMIUM_WHITE",
      floorId: "DARK_TURNTABLE",
    });

    expect(result.success).toBe(false);
    expect(
      StudioTreatmentSchema.safeParse({
        backgroundId: "GREY_STUDIO",
        floorId: "WHITE_TURNTABLE",
      }).success,
    ).toBe(false);
  });

  it("requires a floor for a studio and never substitutes one", () => {
    expect(
      ProcessingOptionsSchema.safeParse({ backgroundId: "DARK_STUDIO" }).success,
    ).toBe(false);
  });

  it("keeps the original background without a floor", () => {
    expect(ProcessingOptionsSchema.parse({ backgroundId: "ORIGINAL" })).toEqual({
      backgroundId: "ORIGINAL",
      crop: "MAINTAIN_COMPOSITION",
      enhancement: true,
      outputFormat: "JPEG",
      paddingPercent: 8,
      platePrivacy: true,
      quality: 90,
      shadow: "NATURAL",
    });
    expect(
      ProcessingOptionsSchema.safeParse({
        backgroundId: "ORIGINAL",
        floorId: "WHITE_STUDIO",
      }).success,
    ).toBe(false);
  });

  it("accepts only semantic IDs, never a storage location", () => {
    expect(
      ProcessingOptionsSchema.safeParse({
        backgroundId: "DARK_STUDIO",
        floorId: "DARK_TURNTABLE",
        floorUrl: "https://bucket.s3.amazonaws.com/studio-assets/v1/floors/x.png",
      }).success,
    ).toBe(false);
  });
});
