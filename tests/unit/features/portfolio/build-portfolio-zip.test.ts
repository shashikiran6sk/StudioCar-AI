import { unzipSync } from "fflate";
import { describe, expect, it } from "vitest";

import { buildPortfolioZip } from "../../../../apps/web/src/features/portfolio/build-portfolio-zip";

describe("buildPortfolioZip", () => {
  it("stores every image under its own name", () => {
    const archive = buildPortfolioZip([
      { bytes: new Uint8Array([1, 2, 3]), filename: "processed-01.webp" },
      { bytes: new Uint8Array([4, 5]), filename: "processed-02.webp" },
    ]);

    expect(unzipSync(archive)).toEqual({
      "processed-01.webp": new Uint8Array([1, 2, 3]),
      "processed-02.webp": new Uint8Array([4, 5]),
    });
  });

  it("never lets one image overwrite another with the same name", () => {
    const archive = buildPortfolioZip([
      { bytes: new Uint8Array([1]), filename: "processed-01.webp" },
      { bytes: new Uint8Array([2]), filename: "processed-01.webp" },
    ]);

    expect(Object.keys(unzipSync(archive))).toEqual([
      "processed-01.webp",
      "processed-01-2.webp",
    ]);
  });
});
