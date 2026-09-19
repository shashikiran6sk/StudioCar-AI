import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PortfolioHeader } from "../../../../apps/web/src/features/portfolio/portfolio-header";
import { PORTFOLIO_TEST_DATA } from "./portfolio-test-data";

describe("PortfolioHeader", () => {
  it("renders screenshot-derived vehicle and treatment context", () => {
    render(<PortfolioHeader portfolio={PORTFOLIO_TEST_DATA} />);

    expect(screen.getByRole("link", { name: /Back to Inventory/ })).toHaveAttribute(
      "href",
      "/inventory",
    );
    expect(screen.getByRole("heading", { name: "2022 BMW 3 Series" })).toBeVisible();
    expect(screen.getByText(/BMW · 3 Series · NL-3429/)).toBeVisible();
    expect(screen.getByText(/2 images · Premium White/)).toBeVisible();
  });

  it("makes partial processing visible without hiding successful images", () => {
    render(
      <PortfolioHeader
        portfolio={{ ...PORTFOLIO_TEST_DATA, status: "NEEDS_ATTENTION" }}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("partially successful batch");
  });
});
