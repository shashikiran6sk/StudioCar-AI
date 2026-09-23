import { describe, expect, it } from "vitest";

import {
  ExistingVehicleSelectionModeSchema,
  StudioSelectionContextSchema,
} from "../../../packages/contracts/src/studio-selection";

const image = {
  assetId: "331a1e25-b9d8-4b1a-a398-8351a58f8c24",
  displayOrder: 0,
  failureReason: "UNUSABLE_IMAGE",
  height: null,
  originalFilename: "front.jpg",
  previewUrl: "https://private.s3.test/front.jpg",
  replaceRequired: true,
  selected: false,
  sizeBytes: 2_048,
  width: null,
};

const context = {
  images: [image],
  mode: "REPLACE_FAILED",
  options: {},
  vehicle: {
    brand: null,
    id: "0e879f46-1193-4d77-b785-057fe026d998",
    model: null,
    name: "2024 BMW X1",
    stockId: null,
    variant: null,
    year: null,
  },
};

describe("StudioSelectionContextSchema", () => {
  it("accepts an existing-vehicle context and normalizes its options", () => {
    expect(StudioSelectionContextSchema.parse(context).options).toMatchObject({
      background: "PREMIUM_WHITE",
      floor: "HORIZON",
    });
  });

  it("never initializes a new upload from server context", () => {
    expect(ExistingVehicleSelectionModeSchema.safeParse("NEW_UPLOAD").success).toBe(false);
    expect(
      StudioSelectionContextSchema.safeParse({ ...context, mode: "NEW_UPLOAD" }).success,
    ).toBe(false);
  });

  it("rejects an empty photo list, unknown reasons, and extra fields", () => {
    expect(StudioSelectionContextSchema.safeParse({ ...context, images: [] }).success)
      .toBe(false);
    expect(
      StudioSelectionContextSchema.safeParse({
        ...context,
        images: [{ ...image, failureReason: "PROVIDER_TIMEOUT" }],
      }).success,
    ).toBe(false);
    expect(
      StudioSelectionContextSchema.safeParse({ ...context, errorMessage: "x" }).success,
    ).toBe(false);
  });
});
