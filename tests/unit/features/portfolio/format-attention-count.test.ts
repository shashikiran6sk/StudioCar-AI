import { describe, expect, it } from "vitest";

import { formatAttentionCount } from "../../../../apps/web/src/features/portfolio/format-attention-count";

describe("formatAttentionCount", () => {
  it("counts failed images against the batch", () => {
    expect(formatAttentionCount(2, 20)).toBe("2 of 20 images need attention");
    expect(formatAttentionCount(1, 20)).toBe("1 of 20 images needs attention");
    expect(formatAttentionCount(1, 1)).toBe("1 of 1 image needs attention");
  });
});
