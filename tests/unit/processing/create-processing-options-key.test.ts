import { describe, expect, it } from "vitest";

import { ProcessingOptionsSchema } from "../../../packages/contracts/src/processing";
import { createProcessingOptionsKey } from "../../../packages/processing/src/create-processing-options-key";

const whiteStudio = ProcessingOptionsSchema.parse({});

describe("createProcessingOptionsKey", () => {
  it("gives the same treatment the same key regardless of key order", () => {
    const reordered = ProcessingOptionsSchema.parse({
      shadow: whiteStudio.shadow,
      quality: whiteStudio.quality,
      background: whiteStudio.background,
    });

    expect(createProcessingOptionsKey(whiteStudio)).toHaveLength(64);
    expect(createProcessingOptionsKey(reordered)).toBe(
      createProcessingOptionsKey(whiteStudio),
    );
  });

  it("separates treatments that differ only by background or floor", () => {
    const key = createProcessingOptionsKey(whiteStudio);

    expect(
      createProcessingOptionsKey({ ...whiteStudio, background: "DARK_STUDIO" }),
    ).not.toBe(key);
    expect(createProcessingOptionsKey({ ...whiteStudio, floor: "PLAIN" })).not.toBe(
      key,
    );
  });
});
