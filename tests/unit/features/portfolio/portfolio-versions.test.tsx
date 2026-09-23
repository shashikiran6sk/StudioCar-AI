import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PortfolioVersions } from "../../../../apps/web/src/features/portfolio/portfolio-versions";
import {
  DARK_VERSION_ID,
  PORTFOLIO_OPTIONS,
  PORTFOLIO_TEST_DATA,
  WHITE_VERSION_ID,
} from "./portfolio-test-data";

describe("PortfolioVersions", () => {
  it("lists every studio version and marks the one shown", () => {
    render(
      <PortfolioVersions
        portfolio={{
          ...PORTFOLIO_TEST_DATA,
          selectedVersionId: DARK_VERSION_ID,
          versions: [
            {
              completedAt: "2026-09-21T10:30:00.000Z",
              id: DARK_VERSION_ID,
              imageCount: 3,
              options: { ...PORTFOLIO_OPTIONS, background: "DARK_STUDIO" },
            },
            ...PORTFOLIO_TEST_DATA.versions,
          ],
        }}
      />,
    );

    const dark = screen.getByRole("link", { name: /Dark Studio · Standard floor/ });
    expect(dark).toHaveAttribute("aria-current", "page");
    expect(dark).toHaveTextContent("3 images · Sep 21, 2026 · Showing");
    expect(
      screen.getByRole("link", { name: /Premium White · Standard floor/ }),
    ).toHaveAttribute(
      "href",
      `/inventory/${PORTFOLIO_TEST_DATA.id}?version=${WHITE_VERSION_ID}`,
    );
  });

  it("stays out of the way when there is only one version", () => {
    const { container } = render(
      <PortfolioVersions portfolio={PORTFOLIO_TEST_DATA} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
