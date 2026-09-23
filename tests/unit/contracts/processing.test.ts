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

  it("requires an asset only for custom backgrounds", () => {
    expect(
      ProcessingOptionsSchema.safeParse({ background: "CUSTOM" }).success,
    ).toBe(false);
    expect(
      ProcessingOptionsSchema.safeParse({
        background: "PREMIUM_WHITE",
        customBackgroundAssetId: "4f9d4891-157f-49ed-aa5a-c026abc0a768",
      }).success,
    ).toBe(false);
  });
  it("accepts either floor and refuses one the worker cannot draw", () => {
    expect(ProcessingOptionsSchema.parse({ floor: "TURNTABLE" }).floor).toBe(
      "TURNTABLE",
    );
    expect(ProcessingOptionsSchema.safeParse({ floor: "MIRROR" }).success).toBe(
      false,
    );
  });
});
