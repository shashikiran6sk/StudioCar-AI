import { expect, it } from "vitest";

import { applyEnhancementLevels } from "../../../../../workers/image-processing/src/execution/apply-enhancement-levels";

it("stretches colour, keeps alpha, and keeps black shadow pixels black", async () => {
  const layer = {
    channels: 4 as const,
    data: Buffer.from([100, 100, 100, 255, 0, 0, 0, 90, 200, 150, 50, 0]),
    height: 1,
    width: 3,
  };
  const result = await applyEnhancementLevels(layer, { gain: 1.5, offset: -60 });
  expect(Array.from(result.data)).toEqual([90, 90, 90, 255, 0, 0, 0, 90, 240, 165, 15, 0]);
  expect(result.width).toBe(3);
});
