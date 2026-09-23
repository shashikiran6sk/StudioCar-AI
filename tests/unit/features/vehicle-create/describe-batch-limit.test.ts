import { describe, expect, it } from "vitest";

import { describeBatchLimit } from "../../../../apps/web/src/features/vehicle-create/describe-batch-limit";

describe("describeBatchLimit", () => {
  it("states the account's real limit and offers the larger batch", () => {
    expect(
      describeBatchLimit({
        largestAvailableBatch: 20,
        maxImagesPerBatch: 5,
        planName: "Free",
      }),
    ).toBe(
      "Free plan · Up to 5 images per batch. Upgrade for 20-image batches.",
    );
  });

  it("follows the plan when an administrator changes its limit", () => {
    // The old sentence was a constant, and said 3 while the server enforced 5.
    expect(
      describeBatchLimit({
        largestAvailableBatch: 20,
        maxImagesPerBatch: 8,
        planName: "Free",
      }),
    ).toBe(
      "Free plan · Up to 8 images per batch. Upgrade for 20-image batches.",
    );
  });

  it("never tells an account on the largest batch to upgrade to it", () => {
    expect(
      describeBatchLimit({
        largestAvailableBatch: 20,
        maxImagesPerBatch: 20,
        planName: "Studio Plus",
      }),
    ).toBe("Studio Plus plan · Up to 20 images per batch.");
  });

  it("offers no upgrade when no plan is on offer", () => {
    expect(
      describeBatchLimit({
        largestAvailableBatch: null,
        maxImagesPerBatch: 5,
        planName: "Free",
      }),
    ).toBe("Free plan · Up to 5 images per batch.");
  });

  it("speaks of a single image in the singular", () => {
    expect(
      describeBatchLimit({
        largestAvailableBatch: 20,
        maxImagesPerBatch: 1,
        planName: "Trial",
      }),
    ).toBe(
      "Trial plan · Up to 1 image per batch. Upgrade for 20-image batches.",
    );
  });
});
