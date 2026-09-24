import { describe, expect, it } from "vitest";

import { createImageAssetLockKey } from "../../../../../apps/web/src/server/db/repositories/create-image-asset-lock-key";

describe("createImageAssetLockKey", () => {
  it("names one shared mutation lock for an image asset", () => {
    expect(createImageAssetLockKey("asset-1")).toBe(
      "image-asset-mutation:asset-1",
    );
  });
});
