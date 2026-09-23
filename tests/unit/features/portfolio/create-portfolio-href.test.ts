import { describe, expect, it } from "vitest";

import { createPortfolioHref } from "../../../../apps/web/src/features/portfolio/create-portfolio-href";

const VEHICLE_ID = "4bb7fa89-c907-4458-9786-8aafc2235728";

describe("createPortfolioHref", () => {
  it("links to the plain portfolio without options", () => {
    expect(createPortfolioHref(VEHICLE_ID)).toBe(`/inventory/${VEHICLE_ID}`);
  });

  it("names the version and the Selection Dialog mode", () => {
    expect(
      createPortfolioHref(VEHICLE_ID, {
        studio: "CREATE_VARIANT",
        versionId: "c".repeat(64),
      }),
    ).toBe(`/inventory/${VEHICLE_ID}?version=${"c".repeat(64)}&studio=CREATE_VARIANT`);
    expect(createPortfolioHref(VEHICLE_ID, { versionId: null })).toBe(
      `/inventory/${VEHICLE_ID}`,
    );
  });
});
