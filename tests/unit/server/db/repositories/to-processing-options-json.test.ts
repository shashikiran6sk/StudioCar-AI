import { describe, expect, it } from "vitest";

import { ProcessingOptionsSchema } from "../../../../../packages/contracts/src/processing";
import { toProcessingOptionsJson } from "../../../../../apps/web/src/server/db/repositories/to-processing-options-json";

describe("toProcessingOptionsJson", () => {
  it("persists normalized processing values without UI labels", () => {
    expect(toProcessingOptionsJson(ProcessingOptionsSchema.parse({}))).toEqual({
      background: "PREMIUM_WHITE",
      crop: "MAINTAIN_COMPOSITION",
      enhancement: true,
      floor: "HORIZON",
      outputFormat: "JPEG",
      paddingPercent: 8,
      platePrivacy: true,
      quality: 90,
      shadow: "NATURAL",
    });
  });

  // Regression: the floor was once left out here, so the worker read every
  // stored job back as the standard floor.
  it("stores the chosen floor so the worker reads it back", () => {
    const options = ProcessingOptionsSchema.parse({ floor: "PLAIN" });

    expect(ProcessingOptionsSchema.parse(toProcessingOptionsJson(options))).toEqual(
      options,
    );
  });
});
