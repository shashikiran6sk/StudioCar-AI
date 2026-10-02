import { describe, expect, it } from "vitest";

import {
  ProcessingOptionsSchema,
  StoredProcessingOptionsSchema,
} from "../../../packages/contracts/src/processing";

describe("processing contracts", () => {
  it("uses normalized domain defaults instead of UI labels", () => {
    expect(ProcessingOptionsSchema.parse({})).toEqual({
      background: "PREMIUM_WHITE",
      floor: "HORIZON",
      crop: "MAINTAIN_COMPOSITION",
      enhancement: true,
      paddingPercent: 8,
      quality: 90,
    });
  });

  it.each([
    ["platePrivacy", true],
    ["shadow", "NATURAL"],
    ["outputFormat", "JPEG"],
  ])("rejects the removed %s option instead of silently ignoring it", (key, value) => {
    expect(ProcessingOptionsSchema.safeParse({ [key]: value }).success).toBe(false);
  });

  it.each([
    ["size", "auto"],
    ["size", "50MP"],
    ["resolution", "HIGH"],
    ["qualityTier", "HIGH"],
    ["background_image_reference", "https://example.com/studio.png"],
  ])("never lets a browser choose provider input %s", (key, value) => {
    // Resolution follows the account's plan on the server, and backgrounds
    // are StudioCar's own; neither can arrive in a request.
    expect(ProcessingOptionsSchema.safeParse({ [key]: value }).success).toBe(false);
  });

  it("keeps an original photo in its own frame", () => {
    expect(
      ProcessingOptionsSchema.parse({ background: "ORIGINAL" }).crop,
    ).toBe("MAINTAIN_COMPOSITION");
    for (const crop of ["FIT_VEHICLE", "SQUARE"]) {
      expect(
        ProcessingOptionsSchema.safeParse({ background: "ORIGINAL", crop })
          .success,
      ).toBe(false);
    }
    expect(
      ProcessingOptionsSchema.parse({ background: "GREY_STUDIO", crop: "FIT_VEHICLE" })
        .crop,
    ).toBe("FIT_VEHICLE");
  });

  it("reads options stored before the treatment contract changed", () => {
    expect(
      StoredProcessingOptionsSchema.parse({
        background: "DARK_STUDIO",
        crop: "FIT_VEHICLE",
        enhancement: false,
        floor: "PLAIN",
        outputFormat: "JPEG",
        paddingPercent: 8,
        platePrivacy: true,
        quality: 90,
        shadow: "NATURAL",
      }),
    ).toEqual({
      background: "DARK_STUDIO",
      crop: "FIT_VEHICLE",
      enhancement: false,
      floor: "PLAIN",
      paddingPercent: 8,
      quality: 90,
    });
  });

  it("reads a stored original-photo fit with the only composition it can have", () => {
    expect(
      StoredProcessingOptionsSchema.parse({
        background: "ORIGINAL",
        crop: "FIT_VEHICLE",
      }).crop,
    ).toBe("MAINTAIN_COMPOSITION");
  });

  it("still refuses unknown or malformed stored options", () => {
    expect(StoredProcessingOptionsSchema.safeParse({ unknown: true }).success).toBe(false);
    expect(StoredProcessingOptionsSchema.safeParse({ shadow: "HARD" }).success).toBe(false);
    expect(StoredProcessingOptionsSchema.safeParse({ background: "CUSTOM" }).success).toBe(false);
  });

  it("no longer accepts the retired Dealership and Custom backgrounds", () => {
    for (const background of ["DEALERSHIP", "CUSTOM"]) {
      expect(ProcessingOptionsSchema.safeParse({ background }).success).toBe(
        false,
      );
    }
    expect(
      ProcessingOptionsSchema.safeParse({
        background: "PREMIUM_WHITE",
        customBackgroundAssetId: "4f9d4891-157f-49ed-aa5a-c026abc0a768",
      }).success,
    ).toBe(false);
  });

  it("offers a plain background or the standard floor, and nothing else", () => {
    expect(ProcessingOptionsSchema.parse({ floor: "PLAIN" }).floor).toBe(
      "PLAIN",
    );
    for (const floor of ["TURNTABLE", "MIRROR"]) {
      expect(ProcessingOptionsSchema.safeParse({ floor }).success).toBe(false);
    }
  });
});
