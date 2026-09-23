import { describe, expect, it } from "vitest";

import { listStudioAssetKeys } from "../../../../../workers/image-processing/src/studio-assets/list-studio-asset-keys";

describe("listStudioAssetKeys", () => {
  it("lists the three backgrounds and six floors once each", () => {
    const keys = listStudioAssetKeys();

    expect(keys).toHaveLength(9);
    expect(new Set(keys).size).toBe(9);
    expect(keys.filter((key) => key.includes("/backgrounds/"))).toHaveLength(3);
    expect(keys.filter((key) => key.includes("/floors/"))).toHaveLength(6);
  });
});
