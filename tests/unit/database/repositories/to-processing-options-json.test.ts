import { describe, expect, it } from "vitest";

import { ProcessingOptionsSchema } from "../../../../packages/contracts/src/processing";
import { toProcessingOptionsJson } from "../../../../packages/database/src/repositories/to-processing-options-json";

describe("toProcessingOptionsJson", () => {
  it("persists normalized processing values without UI labels", () => {
    expect(toProcessingOptionsJson(ProcessingOptionsSchema.parse({}))).toEqual({
      background: "PREMIUM_WHITE",
      crop: "MAINTAIN_COMPOSITION",
      enhancement: true,
      outputFormat: "JPEG",
      paddingPercent: 8,
      platePrivacy: true,
      quality: 90,
      shadow: "NATURAL",
    });
  });
});
