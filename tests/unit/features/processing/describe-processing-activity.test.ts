import { describe, expect, it } from "vitest";

import { describeProcessingActivity } from "../../../../apps/web/src/features/processing/describe-processing-activity";

describe("describeProcessingActivity", () => {
  it("reports running work first", () => {
    expect(
      describeProcessingActivity({ activeCount: 2, completedCount: 1, failedCount: 1 }),
    ).toBe("2 images processing");
  });

  it("reports failures once nothing is running", () => {
    expect(
      describeProcessingActivity({ activeCount: 0, completedCount: 2, failedCount: 1 }),
    ).toBe("1 image needs attention");
    expect(
      describeProcessingActivity({ activeCount: 0, completedCount: 0, failedCount: 3 }),
    ).toBe("3 images need attention");
  });

  it("reports finished images as ready, never as 0 needing attention", () => {
    expect(
      describeProcessingActivity({ activeCount: 0, completedCount: 3, failedCount: 0 }),
    ).toBe("3 images ready");
    expect(
      describeProcessingActivity({ activeCount: 0, completedCount: 1, failedCount: 0 }),
    ).toBe("1 image ready");
  });
});
