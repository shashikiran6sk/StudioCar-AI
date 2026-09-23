import { describe, expect, it } from "vitest";

import { ProcessingOptionsSchema } from "../../../packages/contracts/src/processing";

describe("processing contracts", () => {
  it("uses normalized domain defaults instead of UI labels", () => {
    expect(ProcessingOptionsSchema.parse({})).toEqual({
      background: "PREMIUM_WHITE",
      floor: "HORIZON",
      crop: "MAINTAIN_COMPOSITION",
      enhancement: true,
      outputFormat: "JPEG",
      paddingPercent: 8,
      platePrivacy: true,
      quality: 90,
      shadow: "NATURAL",
    });
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
