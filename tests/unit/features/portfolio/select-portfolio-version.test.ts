import { describe, expect, it } from "vitest";

import { selectPortfolioVersion } from "../../../../apps/web/src/features/portfolio/select-portfolio-version";
import { PORTFOLIO_TEST_DATA } from "./portfolio-test-data";

describe("selectPortfolioVersion", () => {
  it("finds the version the gallery shows", () => {
    expect(selectPortfolioVersion(PORTFOLIO_TEST_DATA)).toBe(
      PORTFOLIO_TEST_DATA.versions[0],
    );
  });

  it("returns nothing when no version is selected", () => {
    expect(
      selectPortfolioVersion({ ...PORTFOLIO_TEST_DATA, selectedVersionId: null }),
    ).toBeNull();
  });
});
