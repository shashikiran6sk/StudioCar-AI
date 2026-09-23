import { describe, expect, it } from "vitest";

import { createPortfolioZipFilename } from "../../../../apps/web/src/features/portfolio/create-portfolio-zip-filename";

describe("createPortfolioZipFilename", () => {
  it("names the archive after the vehicle", () => {
    expect(createPortfolioZipFilename("2022 BMW 3 Series", null)).toBe(
      "2022-bmw-3-series-studio-images.zip",
    );
  });

  it("adds a version's reference label so versions save apart", () => {
    expect(createPortfolioZipFilename("2022 BMW 3 Series", "T01-S02")).toBe(
      "2022-bmw-3-series-t01-s02-studio-images.zip",
    );
  });

  it("drops characters a filename cannot safely carry", () => {
    expect(createPortfolioZipFilename("  Škoda / Octavia: RS!  ", null)).toBe(
      "skoda-octavia-rs-studio-images.zip",
    );
  });

  it("falls back to a generic name when nothing usable is left", () => {
    expect(createPortfolioZipFilename("—", "")).toBe("vehicle-studio-images.zip");
  });
});
