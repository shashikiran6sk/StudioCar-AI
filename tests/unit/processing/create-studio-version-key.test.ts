import { describe, expect, it } from "vitest";

import { ProcessingOptionsSchema } from "../../../packages/contracts/src/processing";
import { createProcessingOptionsKey } from "../../../packages/processing/src/create-processing-options-key";
import { createStudioVersionKey } from "../../../packages/processing/src/create-studio-version-key";

const whiteStudio = ProcessingOptionsSchema.parse({});

describe("createStudioVersionKey", () => {
  it("keeps the treatment's own key for an unlabelled version", () => {
    expect(createStudioVersionKey(whiteStudio, null)).toBe(
      createProcessingOptionsKey(whiteStudio),
    );
  });

  it("separates versions of one treatment by label", () => {
    const first = createStudioVersionKey(whiteStudio, "T01-S02");
    const second = createStudioVersionKey(whiteStudio, "T01-S04");

    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(first).not.toBe(createProcessingOptionsKey(whiteStudio));
    expect(second).not.toBe(first);
    expect(createStudioVersionKey(whiteStudio, "T01-S02")).toBe(first);
  });

  it("separates labelled versions of different treatments", () => {
    expect(
      createStudioVersionKey({ ...whiteStudio, floor: "PLAIN" }, "same"),
    ).not.toBe(createStudioVersionKey(whiteStudio, "same"));
  });
});
