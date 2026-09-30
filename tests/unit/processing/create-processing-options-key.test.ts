import { describe, expect, it } from "vitest";

import {
  ProcessingOptionsSchema,
  StoredProcessingOptionsSchema,
} from "../../../packages/contracts/src/processing";
import { createProcessingOptionsKey } from "../../../packages/processing/src/create-processing-options-key";

const whiteStudio = ProcessingOptionsSchema.parse({});

describe("createProcessingOptionsKey", () => {
  it("gives the same treatment the same key regardless of key order", () => {
    const reordered = ProcessingOptionsSchema.parse({
      quality: whiteStudio.quality,
      floor: whiteStudio.floor,
      background: whiteStudio.background,
    });

    expect(createProcessingOptionsKey(whiteStudio)).toHaveLength(64);
    expect(createProcessingOptionsKey(reordered)).toBe(
      createProcessingOptionsKey(whiteStudio),
    );
  });

  it("keeps a legacy stored treatment in the version its pixels belong to", () => {
    // Masking, the local shadow and the format never changed a rendering, so
    // a batch stored with them is the same version as one stored without.
    const stored = StoredProcessingOptionsSchema.parse({
      ...whiteStudio,
      outputFormat: "JPEG",
      platePrivacy: true,
      shadow: "NATURAL",
    });
    expect(createProcessingOptionsKey(stored)).toBe(
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
