import { describe, expect, it } from "vitest";

import { describeUploadLimits } from "../../../../apps/web/src/features/marketing/describe-upload-limits";

describe("describeUploadLimits", () => {
  it("names both limits", () => {
    expect(describeUploadLimits({ free: 5, paid: 20 })).toBe(
      "Free: 5 images · Paid: 20 images",
    );
  });

  it("names only the limits that exist, in the singular when needed", () => {
    expect(describeUploadLimits({ free: 1, paid: null })).toBe("Free: 1 image");
    expect(describeUploadLimits({ free: null, paid: 20 })).toBe("Paid: 20 images");
  });

  it("falls back to wording without a number when nothing is on offer", () => {
    expect(describeUploadLimits({ free: null, paid: null })).toBe(
      "Batch size follows your plan",
    );
  });
});
