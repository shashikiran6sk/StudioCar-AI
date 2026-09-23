import { ImageAssetStatus } from "../../../../packages/database-runtime/src";
import { describe, expect, it } from "vitest";

import { imageRequiresReplacement } from "../../../../apps/web/src/server/portfolio/image-requires-replacement";
import { portfolioJob } from "./portfolio-record-test-data";

const createdAt = new Date("2026-09-19T10:00:00.000Z");

describe("imageRequiresReplacement", () => {
  it("accepts a stored, uploaded original", () => {
    expect(imageRequiresReplacement(portfolioJob({ batch: "b", createdAt }))).toBe(false);
  });

  it.each([ImageAssetStatus.INVALID, ImageAssetStatus.DELETED])(
    "requires a new photo when the original is %s",
    (assetStatus) => {
      expect(
        imageRequiresReplacement(portfolioJob({ assetStatus, batch: "b", createdAt })),
      ).toBe(true);
    },
  );
});
