import { describe, expect, it } from "vitest";

import { ProcessingOptionsSchema } from "../../../packages/contracts/src/processing";
import { canonicalProcessingOptions } from "../../../packages/processing/src/canonical-processing-options";

describe("canonicalProcessingOptions", () => {
  it("orders keys the same way whatever order they were supplied in", () => {
    const options = ProcessingOptionsSchema.parse({
      shadow: "STUDIO",
      background: "DARK_STUDIO",
      floor: "PLAIN",
    });

    expect(Object.keys(canonicalProcessingOptions(options))).toEqual([
      "background",
      "crop",
      "enhancement",
      "floor",
      "outputFormat",
      "paddingPercent",
      "platePrivacy",
      "quality",
      "shadow",
    ]);
    expect(canonicalProcessingOptions(options)).toEqual(options);
  });
});
