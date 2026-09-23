import { describe, expect, it } from "vitest";

import { parsePortfolioSearchParams } from "../../../../apps/web/src/features/portfolio/parse-portfolio-search-params";

describe("parsePortfolioSearchParams", () => {
  it("reads a version and a Selection Dialog mode", () => {
    expect(
      parsePortfolioSearchParams({ studio: "REPLACE_FAILED", version: "d".repeat(64) }),
    ).toEqual({ studio: "REPLACE_FAILED", versionId: "d".repeat(64) });
  });

  it("ignores values that are unknown, malformed, or repeated", () => {
    expect(
      parsePortfolioSearchParams({ studio: "NEW_UPLOAD", version: "not-a-key" }),
    ).toEqual({ studio: null, versionId: null });
    expect(
      parsePortfolioSearchParams({ studio: ["REPROCESS_FAILED", "REPLACE_FAILED"] }),
    ).toEqual({ studio: null, versionId: null });
  });
});
