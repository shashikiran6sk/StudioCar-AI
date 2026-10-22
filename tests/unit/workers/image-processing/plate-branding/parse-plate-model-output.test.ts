import { describe, expect, it } from "vitest";

import { parsePlateModelOutput } from "../../../../../workers/image-processing/src/plate-branding/parse-plate-model-output";

describe("plate model output validation", () => {
  it("applies sigmoid to the pinned model's logits and rejects low scores and clipped boxes", () => {
    const logits = new Float32Array(300).fill(-10);
    const boxes = new Float32Array(1200);
    logits[0] = -2; boxes.set([0.5, 0.6, 0.2, 0.1]);
    logits[1] = 3; boxes.set([0, 0, 0.5, 0.5], 4);
    const result = parsePlateModelOutput(logits, boxes);
    expect(result).toHaveLength(1);
    expect(result[0]?.score).toBeCloseTo(0.1192);
    expect(result[0]?.left).toBeCloseTo(0.4);
  });
  it("refuses an incompatible or corrupt tensor", () => {
    expect(() => parsePlateModelOutput(new Float32Array(1), new Float32Array(4))).toThrow();
    expect(() => parsePlateModelOutput(new Float32Array(300).fill(NaN), new Float32Array(1200))).toThrow();
  });
});
