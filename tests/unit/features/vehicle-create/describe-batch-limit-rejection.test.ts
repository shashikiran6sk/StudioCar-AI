import { describe, expect, it } from "vitest";

import { describeBatchLimitRejection } from "../../../../apps/web/src/features/vehicle-create/describe-batch-limit-rejection";

describe("describeBatchLimitRejection", () => {
  it("describes one rejected image with singular grammar", () => {
    expect(describeBatchLimitRejection(5, 1)).toBe(
      "You can upload up to 5 images per batch. 1 image was not added.",
    );
  });

  it("describes many rejected images as one batch-level message", () => {
    expect(describeBatchLimitRejection(5, 10)).toBe(
      "You can upload up to 5 images per batch. 10 images were not added.",
    );
  });

  it("uses a singular limit noun", () => {
    expect(describeBatchLimitRejection(1, 2)).toBe(
      "You can upload up to 1 image per batch. 2 images were not added.",
    );
  });
});
