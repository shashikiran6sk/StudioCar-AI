import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PortfolioHeader } from "../../../../apps/web/src/features/portfolio/portfolio-header";
import { PORTFOLIO_TEST_DATA, WHITE_VERSION_ID } from "./portfolio-test-data";

describe("PortfolioHeader", () => {
  it("renders screenshot-derived vehicle and treatment context", () => {
    render(<PortfolioHeader portfolio={PORTFOLIO_TEST_DATA} />);

    expect(screen.getByRole("link", { name: /Back to Inventory/ })).toHaveAttribute(
      "href",
      "/inventory",
    );
    expect(screen.getByRole("heading", { name: "2022 BMW 3 Series" })).toBeVisible();
    expect(screen.getByText(/Completed Sep 19, 2026/)).toBeVisible();
    expect(screen.getByText(/BMW · 3 Series · NL-3429/)).toBeVisible();
    expect(screen.getByText(/2 images · Premium White · Standard floor/)).toBeVisible();
  });

  it("starts another studio version from the version being shown", () => {
    render(<PortfolioHeader portfolio={PORTFOLIO_TEST_DATA} />);

    expect(
      screen.getByRole("link", { name: "Create studio images" }),
    ).toHaveAttribute(
      "href",
      `/inventory/${PORTFOLIO_TEST_DATA.id}?version=${WHITE_VERSION_ID}&studio=CREATE_VARIANT`,
    );
  });

  it("offers no new version while a batch is processing", () => {
    render(
      <PortfolioHeader
        portfolio={{
          ...PORTFOLIO_TEST_DATA,
          canCreateVersion: false,
          status: "PROCESSING",
        }}
      />,
    );

    expect(
      screen.queryByRole("link", { name: "Create studio images" }),
    ).not.toBeInTheDocument();
  });

  it("names only the vehicle when no version has completed", () => {
    render(
      <PortfolioHeader
        portfolio={{
          ...PORTFOLIO_TEST_DATA,
          images: [],
          selectedVersionId: null,
          versions: [],
        }}
      />,
    );

    expect(screen.getByText("Portfolio")).toBeVisible();
    expect(screen.getByText("BMW · 3 Series · NL-3429")).toBeVisible();
  });
});
